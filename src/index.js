import newsletterSignup from '@financial-times/newsletter-signup';
import express from 'express';
import logger from 'morgan';
import expressHandlebars from 'express-handlebars';
import assertEnv from '@quarterto/assert-env';
import url from 'url';
import useragent from 'useragent';
import ftwebservice from 'express-ftwebservice';
import path from 'path';
import raven from 'raven';
import os from 'os';
import pkg from '../package.json';
import errorhandler from 'errorhandler';
import {env as herokuEnv} from '../app.json';

import {getResponseMsg} from './bower/o-email-only-signup';
import devController from './dev';

const app = express();

let ravenClient;

if(app.get('env') === 'production') {
	assertEnv(['SENTRY_DSN']);
	ravenClient = new raven.Client(process.env.SENTRY_DSN, {
		release: pkg.version,
		name: process.env.HEROKU_APP_NAME || os.hostname(),
		extra: {
			env: process.env,
		},
		tags: {},
	});
	ravenClient.patchGlobal(() => process.exit(1));
}

assertEnv(Object.keys(herokuEnv).filter(key => herokuEnv[key].required));

const port = process.env.PORT || 1337;

if(app.get('env') !== 'production') {
	require('longjohn'); // eslint-disable-line global-require
}

if(process.env.INJECT_SCRIPT) {
	app.locals.injectScript = process.env.INJECT_SCRIPT;
}

app.engine('html', expressHandlebars({
	extname: '.html',
	defaultLayout: 'main',
}));
app.set('view engine', 'html');

app.use(logger(process.env.LOG_FORMAT || (app.get('env') === 'development' ? 'dev' : 'combined')));

ftwebservice(app, {
	manifestPath: path.join(__dirname, '../package.json'),
	about: {
		schemaVersion: 1,
		name: 'distro-light-signup',
		purpose: 'Service to display a light signup form and handle email subscription',
		audience: 'public',
		primaryUrl: 'https://distro-light-signup.ft.com',
		contacts: [
			{
				name: 'Matthew Brennan',
				email: 'matthew.brennan@ft.com',
			},
			{
				name: 'George Crawford',
				email: 'george.crawford@ft.com',
			},
		],
	},
});

if(app.get('env') === 'production') {
	app.use(raven.middleware.express.requestHandler(ravenClient));
	app.use((req, res, next) => {
		ravenClient.setExtraContext(raven.parsers.parseRequest(req));
		req.raven = ravenClient;
		next();
	});
}

app.get('/', (req, res) => {
	const {family, os} = useragent.parse(req.get('user-agent'));

	const currentUrl = url.parse(req.url, true);
	const autofocusUrl = url.format({
		...currentUrl,
		search: undefined,
		query: {
			...currentUrl.query,
			autofocus: true,
		},
	});

	res.render('signup', {
		isAndroidFacebook: family === 'Facebook' && os.family === 'Android',
		autofocusUrl,
		autofocus: req.query.autofocus,
		article: req.query.article,
		product: req.query.product,
		mailingList: req.query.mailinglist,
	});
});
app.use('/signup', (req, res, next) => { req.newsletterSignupPostNoResponse = !!req.query.form; next(); }, newsletterSignup);
app.use('/public', express.static('public'));
app.use('/dev', devController);

app.post('/signup', (req, res) => {
	if(req.newsletterSignupPostNoResponse) {
		res.render('thanks', {
			somethingWentWrong: res.locals.newsletterSignupStatus === 'INVALID_REQUEST',
			message: getResponseMsg(
				res.locals.newsletterSignupStatus,
				encodeURIComponent(req.query.article ? `/content/${req.query.article}` : '/')
			),
		});
	}
});

function redirectToNext(req, res) {
	const nextUrl = url.format({
		hostname: 'next.ft.com',
		pathname: req.path,
		protocol: 'https',
		query: req.query,
	});

	const optInUrl = url.format({
		hostname: 'next.ft.com',
		pathname: '/__opt-in',
		protocol: 'https',
		query: {
			referrer: nextUrl,
			optedvia: 'light-signup',
		},
	});

	res.redirect(optInUrl);
}

app.get('/products', redirectToNext);
app.get('/login', redirectToNext);

if(app.get('env') === 'development') {
	app.use(errorhandler());
} else if(app.get('env') === 'production') {
	app.use(raven.middleware.express.errorHandler(ravenClient));
}

app.listen(port, () => console.log(`Listening on port ${port}`));
