import { getRemoteIp, getRemoteGeoLocation } from './requestUtils';

const REQUEST_MOCK = {
	info: {},
	headers: {},
	query: {},
};

describe('getRemoteIp', () => {
	it('returns an IP address from a query string parameter', () => {
		const request = {
			...REQUEST_MOCK,
			info: {
				remoteAddress: '127.0.0.1',
			},
			headers: {
				'fastly-client-ip': '192.168.0.1',
			},
			query: {
				__set_geoip: '89.22.50.79',
			},
		};

		expect(getRemoteIp(request)).toEqual('89.22.50.79');
	});

	it('returns an IP address from Fastly header', () => {
		const request = {
			...REQUEST_MOCK,
			info: {
				remoteAddress: '127.0.0.1',
			},
			headers: {
				'fastly-client-ip': '192.168.0.1',
			},
			query: {},
		};

		expect(getRemoteIp(request)).toEqual('192.168.0.1');
	});

	it('returns an IP address from a request remote address', () => {
		const request = {
			...REQUEST_MOCK,
			info: {
				remoteAddress: '127.0.0.1',
			},
			headers: {},
			query: {},
		};

		expect(getRemoteIp(request)).toEqual('127.0.0.1');
	});

	it('returns nothing if none of the methods above yielded a result', () => {
		const request = {
			...REQUEST_MOCK,
			info: {},
			headers: {},
			query: {},
		};

		expect(getRemoteIp(request)).toBeUndefined();
	});
});

describe('getRemoteGeoLocation', () => {
	it('returns an empty geo location if a request has no X-Region header', () => {
		const request = {
			...REQUEST_MOCK,
			headers: {},
		};

		expect(getRemoteGeoLocation(request)).toEqual({});
	});

	it('returns an empty geo location if X-Region header has empty country and region', () => {
		const request = {
			...REQUEST_MOCK,
			headers: {
				'x-region': '/',
			},
		};

		expect(getRemoteGeoLocation(request)).toEqual({});
	});

	it('returns only a country if X-Region header contains a non-empty country and an empty region', () => {
		const request = {
			...REQUEST_MOCK,
			headers: {
				'x-region': 'ru/',
			},
		};

		expect(getRemoteGeoLocation(request)).toEqual({
			country: 'ru',
		});
	});

	it('returns only a region if X-Region header contains an empty country and a non-empty region', () => {
		const request = {
			...REQUEST_MOCK,
			headers: {
				'x-region': '/ny',
			},
		};

		expect(getRemoteGeoLocation(request)).toEqual({
			region: 'ny',
		});
	});

	it('returns both a country and a region if X-Region header contains non-empty country and region', () => {
		const request = {
			...REQUEST_MOCK,
			headers: {
				'x-region': 'us/ny',
			},
		};

		expect(getRemoteGeoLocation(request)).toEqual({
			country: 'us',
			region: 'ny',
		});
	});
});
