import oEmailOnlySignup from 'o-email-only-signup';
import querystring from 'querystring';

const {article, product, mailinglist} = querystring.parse(location.search.substr(1));

oEmailOnlySignup.init(document.body, {
	signupUrl: `/signup?article=${article}&product=${product}&mailinglist=${mailinglist}`,
});

window.addEventListener('DOMContentLoaded', () => {
	const input = document.querySelector('input[type=email]');
	input.addEventListener('click', () => {
		document.querySelector('.o-email-only-signup__no-spam').textContent = 'clicked';
		input.focus();
	});
});
