const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
const secretDefault = (process.env.NODE_ENV !== 'production' && random32) || ''; // no prod default

const CSRF_SECRET_ERROR = 'CSRF Secret must be a random 32+ char string';
const OAUTH_SECRET_ERROR = 'Invalid OAUTH Secret';
const OAUTH_KEY_ERROR = 'Invalid OAUTH Key';
const COOKIE_SECRET_ERROR = 'Cookie Secret must be a random 32+ char string';

const validateCookieSecret = secret => {
	if (!secret || secret.toString().length < 32) {
		throw new Error(COOKIE_SECRET_ERROR);
	}
};

const validateCsrfSecret = secret => {
	if (!secret || secret.toString().length < 32) {
		throw new Error(CSRF_SECRET_ERROR);
	}
};

const validateOauthSecret = secret => {
	if (!secret || secret.toString().length < 1) {
		throw new Error(OAUTH_SECRET_ERROR);
	}
};

const validateOauthKey = key => {
	if (!key || key.toString().length < 1) {
		throw new Error(OAUTH_KEY_ERROR);
	}
};

const PROTOCOL_ERROR = 'Protocol must be http or https';

const validateProtocol = protocol => {
	if (!['http', 'https'].includes(protocol)) {
		throw new Error(PROTOCOL_ERROR);
	}
};

const DEV_SUBSTRING = '.dev.';
const validateServerHost = host => {
	if (typeof host !== 'string') {
		throw new Error('Server host property must be a string');
	}
	const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
	if (process.env.NODE_ENV === 'production' && host.includes(DEV_SUBSTRING)) {
		throw new Error(`Server host ${host} must not include '.dev.' in production`);
	}
	if (isDev && !host.includes(DEV_SUBSTRING)) {
		throw new Error(`Server host ${host} must include '.dev.' in development`);
	}
};

module.exports = {
	CSRF_SECRET_ERROR,
	OAUTH_SECRET_ERROR,
	OAUTH_KEY_ERROR,
	COOKIE_SECRET_ERROR,
	secretDefault,
	validateCookieSecret,
	validateCsrfSecret,
	validateOauthKey,
	validateOauthSecret,
	validateProtocol,
	validateServerHost,
};
