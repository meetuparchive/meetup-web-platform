import { PROTOCOL_ERROR, validateProtocol, validateServerHost } from './build';

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
	it('throws error for dev in prod', () => {
		const _env = process.env.NODE_ENV; // cache the 'real' value to restore later
		process.env.NODE_ENV = 'development';
		expect(() => validateServerHost('foo.dev.bar.com')).not.toThrow();
		expect(() => validateServerHost('foo.bar.com')).toThrow();
		process.env.NODE_ENV = _env; // restore original env value
	});
});
