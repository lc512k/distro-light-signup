import oEmailOnlySignup from 'o-email-only-signup';
import querystring from 'querystring';

const {article} = querystring.parse(location.search);

oEmailOnlySignup.init(document.body, {
	signupUrl: `/signup?article=${article}`,
});
