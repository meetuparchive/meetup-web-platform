import { Cookie } from 'tough-cookie';
import { Observable } from 'rxjs';
import Hapi from 'hapi';
import getRoutes from './routes';
import getConfig from './util/config';

const server = new Hapi.Server();

server.connection();

// mock the anonAuthPlugin
server.decorate(
	'request',
	'authorize',
	request => () => Observable.of(request),
	{ apply: true }
);

const MOCK_RESULT = 'asdf';
const MOCK_RENDER_REQUEST = () => Observable.of({ result: MOCK_RESULT, statusCode: 200 });

const MOCK_renderRequestMap = {
	'en-US': MOCK_RENDER_REQUEST,
};

const MOCK_OAUTH_COOKIES = {
	oauth_token: '1234',
	refresh_token: 'asdf',
	anonymous: true
};

const MOCK_API_RESULT = {
	queries: [],
	responses: [],
};

const serverReady = getConfig()
	.then(config => getRoutes(MOCK_renderRequestMap, config, () => () => Observable.of(MOCK_API_RESULT)))
	.then(server.route.bind(server));

describe('routes', () => {
	it('serves the homepage route', () =>
		serverReady
			.then(() => server.inject({ url: '/' }))
			.then(response => expect(response.payload).toEqual(MOCK_RESULT))
	);
	it('serves the api route', () =>
		serverReady
			.then(() =>
				server.inject({
					url: '/api',
				})
			)
			.then(response => expect(JSON.parse(response.payload)).toEqual(MOCK_API_RESULT))
	);
	it('sets oauth cookies in response when require.app.setCookies is true', () =>
		serverReady
			.then(() => {
				const cookie = Object.keys(MOCK_OAUTH_COOKIES)
					.reduce((acc, key) => acc += `${key}=${JSON.stringify(MOCK_OAUTH_COOKIES[key])}; `, '');

				return server.inject({
					url: '/',
					headers: { cookie },
					app: {
						setCookies: true
					}
				});
			})
			.then(response => {
				const cookieHeader = response.headers['set-cookie'];
				const cookies = (cookieHeader instanceof Array) ?
					cookieHeader.map(Cookie.parse) :
					[Cookie.parse(cookieHeader)];

				expect(cookieHeader).not.toBeNull();

				const cookieMap = cookies.reduce(
					(acc, cookie) => ({ ...acc, [cookie.key]: cookie.value }),
					{}
				);

				expect(cookieMap.oauth_token).toBe(MOCK_OAUTH_COOKIES.oauth_token);
				expect(cookieMap.refresh_token).toBe(MOCK_OAUTH_COOKIES.refresh_token);
				expect(cookieMap.anonymous).toBe(MOCK_OAUTH_COOKIES.anonymous.toString());
			})
	);
});

