import newsletterSignup from '@financial-times/newsletter-signup';
import express from 'express';
import logger from 'morgan';
import expressHandlebars from 'express-handlebars';
import assertHerokuEnv from '@quarterto/assert-heroku-env';
import assertEnv from '@quarterto/assert-env';
import readParentJson from '@quarterto/read-parent-json';
import url from 'url';
import ftwebservice from 'express-ftwebservice';
import raven from 'raven';
import os from 'os';
import errorhandler from 'errorhandler';
import fs from 'fs';
import path from 'path';
import https from 'https';

import {getResponseMsg} from '../bower_components/o-email-only-signup/src/email-only-signup';
import devController from './dev';
import {encrypt, decrypt} from './encryption';

const pkg = readParentJson('package.json', __dirname);
const app = express();

if(app.get('env') === 'development') {
	require('longjohn'); // eslint-disable-line global-require
}

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

assertHerokuEnv();

const port = process.env.PORT || 1337;

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
	about: {
		schemaVersion: 1,
		name: 'distro-light-signup',
		purpose: 'Service to display a light signup form and handle email subscription',
		audience: 'public',
		primaryUrl: 'https://distro-light-signup.ft.com',
		appVersion: pkg.version,
		dateDeployed: process.env.HEROKU_RELEASE_CREATED_AT || new Date(),
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
	const {
		external,
		article,
		product,
		mailinglist: mailingList,
	} = req.query;

	const isAndroid = req.get('x-mobile-os') === 'android';
	const showFormHack = process.env.ANDROID_FORM_HACK === 'true' && isAndroid && !external;

	if(showFormHack) {
		const currentUrl = url.parse(req.url, true);
		const externalUrl = url.format({
			...currentUrl,
			search: undefined,
			query: {
				...currentUrl.query,
				external: true,
				encryptedCookies: encrypt(req.get('cookie')),
				ua: req.get('user-agent'),
			},
		});

		res.render('signup', {
			showFormHack,
			externalUrl,
			external,
			article,
			product,
			mailingList,
		});

		// Don't cache form HTML which contains personalised spoor ID and cookies
		// (see 'Vary: x-mobile-os', below).
		res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.set('Expires', '-1');
		res.set('Pragma', 'no-cache');
	} else {
		const cookiesFromUrl = req.query.encryptedCookies && decrypt(req.query.encryptedCookies);
		const uaFromUrl = req.query.ua;
		res.render('signup', {
			external,
			article,
			product,
			mailingList,
			cookiesFromUrl,
			uaFromUrl,
		});
	}

	res.set('vary', 'x-mobile-os');
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

app.get('/signup/unsubscribe/:user', (req, res) => {
	res.json(res.locals);
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
app.get('/newsletters', redirectToNext);

if(app.get('env') === 'development') {
	app.use(errorhandler());
} else if(app.get('env') === 'production') {
	app.use(raven.middleware.express.errorHandler(ravenClient));
}

const server = https.createServer({
	cert: fs.readFileSync(path.resolve('ft-mw4446.osb.ft.com.crt')),
	key: fs.readFileSync(path.resolve('ft-mw4446.osb.ft.com.key')),
}, app);

server.listen(port, () => console.log(`Listening on port ${port}`));
