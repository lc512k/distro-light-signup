import oEmailOnlySignup from 'o-email-only-signup';
import url from 'url';
import querystring from 'querystring';

const {article, product, mailinglist} = querystring.parse(location.search.substr(1));
const signupUrl = url.format({
	pathname: '/signup',
	query: {article, product, mailinglist},
});

oEmailOnlySignup.init(document.body, {signupUrl});
