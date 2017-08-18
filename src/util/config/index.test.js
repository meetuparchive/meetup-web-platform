import config, {
	COOKIE_SECRET_ERROR,
	CSRF_SECRET_ERROR,
	OAUTH_SECRET_ERROR,
	OAUTH_KEY_ERROR,
	PROTOCOL_ERROR,
	SALT_ERROR,
	validateCookieSecret,
	validateCsrfSecret,
	validateOauthSecret,
	validateOauthKey,
	validatePhotoScalerSalt,
	validateProtocol,
	validateServerHost,
} from './index';

const string1 = '1';
const string31 = 'asdfasdfasdfasdfasdfasdfasdfasd';
const string32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
const string36 = 'asdfasdfasdfasdfasdfasdfasdfasdfasdf';

describe('validateProtocol', () => {
	it('does not error when protocol is `http` or `https`', () => {
		expect(() => validateProtocol('http')).not.toThrow();
		expect(() => validateProtocol('https')).not.toThrow();
	});

	it('throws error when the protocol is not `http` or `https`', () => {
		expect(() => validateProtocol('ftp')).toThrowError(PROTOCOL_ERROR);
	});
});

describe('validateServerHost', () => {
	it('throws an error for non-string values', () => {
		expect(() => validateServerHost(null)).toThrow();
		expect(() => validateServerHost(1234)).toThrow();
		expect(() => validateServerHost({ foo: 'bar' })).toThrow();
		expect(() => validateServerHost(['foo'])).toThrow();
		expect(() => validateServerHost('foo')).not.toThrow();
	});
	it('throws error for dev in prod', () => {
		const _env = process.env.NODE_ENV; // cache the 'real' value to restore later
		process.env.NODE_ENV = 'production';
		expect(() => validateServerHost('foo.dev.bar.com')).toThrow();
		expect(() => validateServerHost('foo.bar.com')).not.toThrow();
		process.env.NODE_ENV = _env; // restore original env value
	});
});

describe('config', () => {
	it('is a valid JS object', () => {
		expect(config).toBeTruthy();
		expect(config).toBeInstanceOf(Object);
	});

	it('has values for all env variables', () => {
		expect(config.env).toBeTruthy();
		expect(config.api).toBeTruthy();
		expect(config.api.protocol).toBeTruthy();
		expect(config.api.host).toBeTruthy();
		expect(config.api.timeout).toBeTruthy();
		expect(config.api.root_url).toBeTruthy();
		expect(config.cookie_encrypt_secret).toBeTruthy();
		expect(config.csrf_secret).toBeTruthy();
		expect(config.app_server).toBeTruthy();
		expect(config.app_server.protocol).toBeTruthy();
		expect(config.duotone_urls).toBeTruthy();
		expect(config.isDev).toBeDefined();
		expect(config.isProd).toBeDefined();
		expect(config.oauth).toBeTruthy();
		expect(config.oauth.auth_url).toBeTruthy();
		expect(config.oauth.access_url).toBeTruthy();
		expect(config.oauth.secret).toBeTruthy();
		expect(config.oauth.key).toBeTruthy();
		expect(config.photo_scaler_salt).toBeTruthy();
	});
});

describe('validateCookieSecret', () => {
	it('does not error when secret is 32 char or more', () => {
		expect(() => validateCookieSecret(string32)).not.toThrow();
		expect(() => validateCookieSecret(string36)).not.toThrow();
	});

	it('throws error when secret is missing or less than 32 characters', () => {
		expect(() => validateCookieSecret(null)).toThrowError(COOKIE_SECRET_ERROR);
		expect(() => validateCookieSecret(string31)).toThrowError(
			COOKIE_SECRET_ERROR
		);
	});
});

describe('validateCsrfSecret', () => {
	it('does not error when secret is 32 char or more', () => {
		expect(() => validateCsrfSecret(string32)).not.toThrow();
		expect(() => validateCsrfSecret(string36)).not.toThrow();
	});

	it('throws error when secret is missing or less than 32 characters', () => {
		expect(() => validateCsrfSecret(null)).toThrowError(CSRF_SECRET_ERROR);
		expect(() => validateCsrfSecret(string31)).toThrowError(CSRF_SECRET_ERROR);
	});
});

describe('validateOauthSecret', () => {
	it('does not error when secret is 1 char or more', () => {
		expect(() => validateOauthSecret(string1)).not.toThrow();
		expect(() => validateOauthSecret(string36)).not.toThrow();
	});

	it('throws error when secret is missing or empty', () => {
		expect(() => validateOauthSecret(null)).toThrowError(OAUTH_SECRET_ERROR);
		expect(() => validateOauthSecret('')).toThrowError(OAUTH_SECRET_ERROR);
	});
});

describe('validateOauthKey', () => {
	it('does not error when key is 1 char or more', () => {
		expect(() => validateOauthKey(string1)).not.toThrow();
		expect(() => validateOauthKey(string36)).not.toThrow();
	});

	it('throws error when key is missing or empty', () => {
		expect(() => validateOauthKey(null)).toThrowError(OAUTH_KEY_ERROR);
		expect(() => validateOauthKey('')).toThrowError(OAUTH_KEY_ERROR);
	});
});

describe('validatePhotoScalerSalt', () => {
	it('does not error when salt is 1 char or more', () => {
		expect(() => validatePhotoScalerSalt(string1)).not.toThrow();
		expect(() => validatePhotoScalerSalt(string36)).not.toThrow();
	});

	it('throws error when salt is missing or empty', () => {
		expect(() => validatePhotoScalerSalt(null)).toThrowError(SALT_ERROR);
		expect(() => validatePhotoScalerSalt('')).toThrowError(SALT_ERROR);
	});
});
