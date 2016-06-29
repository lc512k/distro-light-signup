import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const password = process.env.ENCRYPTION_PASSWORD;

// See https://github.com/chris-rock/node-crypto-examples
module.exports.encrypt = text => {
	const cipher = crypto.createCipher(algorithm, password);
	let crypted = cipher.update(text, 'utf8', 'base64');
	crypted += cipher.final('base64');
	return crypted;
};

module.exports.decrypt = text => {
	const decipher = crypto.createDecipher(algorithm, password);
	let dec = decipher.update(text, 'base64', 'utf8');
	dec += decipher.final('utf8');
	return dec;
};
