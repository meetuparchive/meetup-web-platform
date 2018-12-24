import { getLaunchDarklyUser } from './launchDarkly';

describe('getLaunchDarklyUser', () => {
	const REQUEST_MOCK = {
		info: {},
		headers: {},
		query: {},
	};

	it('creates an anonymous user for an empty member object', () => {
		const user = getLaunchDarklyUser({}, REQUEST_MOCK);

		expect(user).toEqual({
			key: '0',
			anonymous: true,
			custom: {},
		});
	});

	it('creates an anonymous user for an anonymous member', () => {
		const member = {
			id: 0,
		};

		const user = getLaunchDarklyUser(member, REQUEST_MOCK);

		expect(user).toEqual({
			key: '0',
			anonymous: true,
			custom: {},
		});
	});

	it('populates a user with member details', () => {
		const member = {
			id: 12345,
			name: 'Test User',
			email: 'test@test.test',
			country: 'US',
		};

		const user = getLaunchDarklyUser(member, REQUEST_MOCK);

		expect(user).toEqual({
			key: '12345',
			name: 'Test User',
			email: 'test@test.test',
			country: 'US',
			anonymous: false,
			custom: {},
		});
	});

	describe('user IP address', () => {
		const member = {
			id: 12345,
			name: 'Test User',
			email: 'test@test.test',
			country: 'US',
		};

		it('sets a user IP address from a query string parameter', () => {
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

			const user = getLaunchDarklyUser(member, request);

			expect(user.ip).toEqual('89.22.50.79');
		});

		it('sets a user IP address from Fastly header', () => {
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

			const user = getLaunchDarklyUser(member, request);

			expect(user.ip).toEqual('192.168.0.1');
		});

		it('sets a user IP address from a request remote address', () => {
			const request = {
				...REQUEST_MOCK,
				info: {
					remoteAddress: '127.0.0.1',
				},
				headers: {},
				query: {},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.ip).toEqual('127.0.0.1');
		});

		it('does not set a user IP address if none of the methods above yielded a result', () => {
			const request = {
				...REQUEST_MOCK,
				info: {},
				headers: {},
				query: {},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.ip).toBeUndefined();
		});
	});

	describe('custom attributes', () => {
		const member = {
			id: 12345,
			name: 'Test User',
			email: 'test@test.test',
			country: 'US',
		};

		it('sets empty custom attributes if a request has no X-Region header', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.custom).toEqual({});
		});

		it('sets empty custom attributes if X-Region header has empty country and region', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {
					'x-region': '/',
				},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.custom).toEqual({});
		});

		it('sets only an uppercased country to custom attributes if X-Region header contains a non-empty country and an empty region', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {
					'x-region': 'ru/',
				},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.custom).toEqual({
				RequestCountry: 'RU',
			});
		});

		it('sets only an uppercased region to custom attributes if X-Region header contains an empty country and a non-empty region', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {
					'x-region': '/ny',
				},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.custom).toEqual({
				RequestRegion: 'NY',
			});
		});

		it('sets both uppercased country and region custom attributes if X-Region header contains non-empty country and region', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {
					'x-region': 'us/ny',
				},
			};

			const user = getLaunchDarklyUser(member, request);

			expect(user.custom).toEqual({
				RequestCountry: 'US',
				RequestRegion: 'NY',
			});
		});
	});
});
