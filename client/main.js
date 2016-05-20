import oEmailOnlySignup from 'o-email-only-signup';
import querystring from 'querystring';

const {article} = querystring.parse(location.search.substr(1));

oEmailOnlySignup.init(document.body, {
	signupUrl: `/signup?article=${article}`,
});
