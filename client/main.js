import oEmailOnlySignup from 'o-email-only-signup';
import url from 'url';
import querystring from 'querystring';
import Raven from 'raven-js';

const {article, product, mailinglist} = querystring.parse(location.search.substr(1));
const signupUrl = url.format({
	pathname: '/signup',
	query: {article, product, mailinglist},
});

oEmailOnlySignup.init(document.body, {signupUrl});

if(process.env.NODE_ENV === 'production' && process.env.SENTRY_CLIENT_DSN) {
	Raven.config(process.env.SENTRY_CLIENT_DSN).install();
}
