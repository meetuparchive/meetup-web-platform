import Hapi from 'hapi';
import Iron from 'iron';
import requestAuthPlugin from '../../src/plugins/requestAuthPlugin';

const cookieRequest = cookies => ({
	method: 'get',
	url: '/foo',
	headers: {
		Cookie: Object.keys(cookies).map(name => `${name}=${cookies[name]}`).join('; ')
	}
});

const makeMockFetchResponse = responseObj => Promise.resolve({
	text: () => Promise.resolve(JSON.stringify(responseObj)),
	json: () => Promise.resolve(responseObj),
});


const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
const options = {
	API_HOST: 'www.api.meetup.com',
	CSRF_SECRET: random32,
	COOKIE_ENCRYPT_SECRET: random32,
	OAUTH_AUTH_URL: 'https://secure.dev.meetup.com/oauth2/authorize',
	OAUTH_ACCESS_URL: 'https://secure.dev.meetup.com/oauth2/access',
	oauth: {
		key: random32,
		secret: random32,
	}
};
const getEncryptedToken = token => new Promise((resolve, reject) =>
	Iron.seal(token, random32, Iron.defaults, (err, sealed) => resolve(sealed))
);

const expectedOauthToken = 'foobar';

const testAuth = (cookies, test, makeRequest=cookieRequest) => {
	spyOn(global, 'fetch').and.callFake((url, opts) => {
		if (url.includes(options.OAUTH_AUTH_URL)) {
			return makeMockFetchResponse({
				code: 'foo',
			});
		}
		if (url.includes(options.OAUTH_ACCESS_URL)) {
			return makeMockFetchResponse({
				oauth_token: expectedOauthToken,
				refresh_token: 'whatever',
			});
		}
		return makeMockFetchResponse({});
	});
	const fooRoute = {
		method: 'get',
		path: '/foo',
		handler: (request, reply) => reply('bar')
	};
	const server = new Hapi.Server();
	return server
		.connection()
		.register(requestAuthPlugin)
		.then(() => server.route(fooRoute))
		.then(() => server.auth.strategy('default', 'oauth', true, options))
		.then(() => server.inject(makeRequest(cookies)))
		.then(test)
		.then(() => server.stop());
};

describe('logged-in member state', () => {
	// logged-in auth provides MEETUP_MEMBER
	it('Passes MEETUP_MEMBER value as request credentials', () => {
		const cookies = { MEETUP_MEMBER: 'foo' };
		const test = response => {
			expect(response.request.auth.credentials).toBe(cookies.MEETUP_MEMBER);
		};
		return testAuth(cookies, test);
	});

	it('removes MEETUP_MEMBER auth cookies on logout', () => {
		const makeLogoutRequest = cookies => ({
			method: 'get',
			url: '/foo?logout=true',
			headers: {
				Cookie: Object.keys(cookies).map(name => `${name}=${cookies[name]}`).join('; ')
			}
		});
		const cookies = { MEETUP_MEMBER: 'foo' };
		const test = response => {
			expect(response.request.state.MEETUP_MEMBER).toBeNull();
		};
		return testAuth(cookies, test, makeLogoutRequest);
	});
});

describe('logged-out member state', () => {
	// anonymous auth provides oauth_token
	it('Passes oauth_token value as request credentials', () => {
		const cookies = {
			oauth_token: 'foo_oauth',
		};
		const test = response =>
			expect(response.request.auth.credentials).toBe(cookies.oauth_token);

		return getEncryptedToken(cookies.oauth_token)
			.then(oauth_token => testAuth({ oauth_token }, test));
	});

	it('gets a new oauth_token when only refresh_token provided', () => {
		// mock fetch for auth, grant_type: refresh_token
		const cookies = {
			refresh_token: 'asdfasdf',
		};
		const test = response => {
			expect(response.headers['set-cookie'][0].startsWith('oauth_token')).toBe(true);
			expect(response.request.state.__internal_oauth_token).toBe(expectedOauthToken);
		};
		return getEncryptedToken(cookies.refresh_token)
			.then(refresh_token => testAuth({ refresh_token }, test));
	});
	it('gets a new oauth_token and refresh_token when no auth provided', () => {
		// mock fetch for auth, grant_type: refresh_token
		const cookies = {};
		const test = response => {
			expect(response.headers['set-cookie'][0].startsWith('oauth_token')).toBe(true);
			expect(response.headers['set-cookie'][1].startsWith('refresh_token')).toBe(true);
		};
		return testAuth(cookies, test);
	});
});
