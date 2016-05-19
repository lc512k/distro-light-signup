import newsletterSignup from '@financial-times/newsletter-signup';
import express from 'express';
import logger from 'morgan';
import expressHandlebars from 'express-handlebars';
import assertEnv from '@quarterto/assert-env';
import url from 'url';

import {getResponseMsg} from './bower/o-email-only-signup';

assertEnv(Object.keys(require('../app.json').env));

const app = express();
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

app.get('/', (req, res) => res.render('signup', {article: req.query.article}));
app.use('/signup', (req, res, next) => { req.newsletterSignupPostNoResponse = true; next(); }, newsletterSignup);
app.use('/public', express.static('public'));

app.post('/signup', (req, res) => {
	res.render('thanks', {
		message: getResponseMsg(
			res.locals.newsletterSignupStatus,
			encodeURIComponent(req.query.article ? `/content/${req.query.article}` : '/')
		),
	});
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

	console.log(nextUrl, optInUrl);

	res.redirect(optInUrl);
}

app.get('/products', redirectToNext);
app.get('/login', redirectToNext);

app.listen(port, () => console.log(`Listening on port ${port}`));
