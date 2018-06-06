const { properties: config } = require('./');
const {
	COOKIE_SECRET_ERROR,
	CSRF_SECRET_ERROR,
	PROTOCOL_ERROR,
	SALT_ERROR,
	validateCookieSecret,
	validateCsrfSecret,
	validatePhotoScalerSalt,
	validateProtocol,
} = require('./util');

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
		expect(config.isDev).toBeDefined();
		expect(config.isProd).toBeDefined();
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
