import { PROTOCOL_ERROR, validateProtocol } from './build';

describe('validateProtocol', () => {
	it('does not error when protocol is `http` or `https`', () => {
		expect(() => validateProtocol('http')).not.toThrow();
		expect(() => validateProtocol('https')).not.toThrow();
	});

	it('throws error when the protocol is not `http` or `https`', () => {
		expect(() => validateProtocol('ftp')).toThrowError(PROTOCOL_ERROR);
	});
});
