import getRoutes from './routes';
import getConfig from './util/config';
import {
	MOCK_API_RESULT,
	MOCK_OAUTH_COOKIES,
	MOCK_renderRequestMap,
	MOCK_API_PROXY$,
	MOCK_RENDER_RESULT,
	MOCK_REQUEST_COOKIES,
} from './util/mocks/app';
import {
	parseCookieHeader,
	getServer,
} from './util/testUtils';

// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getResponse(injectRequest, server=getServer()) {
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	return getConfig()
		.then(config => getRoutes(
			MOCK_renderRequestMap,
			config,
			MOCK_API_PROXY$)
		)
		.then(server.route.bind(server))
		.then(() => server.inject(injectRequest));
}

describe('routes', () => {
	it('serves the homepage route', () =>
		getResponse({ url: '/' })
			.then(response => expect(response.payload).toEqual(MOCK_RENDER_RESULT))
	);
	it('serves the api route', () =>
		getResponse({ url: '/api' })
			.then(response => expect(JSON.parse(response.payload)).toEqual(MOCK_API_RESULT))
	);
	it('sets oauth cookies in response when request.app.setCookies is true', () =>
		getResponse({ ...MOCK_REQUEST_COOKIES, app: { setCookies: true }})
			.then(response => {
				const cookieHeader = response.headers['set-cookie'];
				expect(cookieHeader).not.toBeNull();

				const cookies = parseCookieHeader(cookieHeader);
				expect(cookies.oauth_token).toBe(MOCK_OAUTH_COOKIES.oauth_token);
				expect(cookies.refresh_token).toBe(MOCK_OAUTH_COOKIES.refresh_token);
				expect(cookies.anonymous).toBe(MOCK_OAUTH_COOKIES.anonymous.toString());
			})
	);
	it('sets tracking cookie in response', () =>
		getResponse({ url: '/' })
			.then(response => {
				const cookieHeader = response.headers['set-cookie'];
				expect(cookieHeader).not.toBeNull();

				const cookies = parseCookieHeader(cookieHeader);
				expect(cookies.meetupTrack).not.toBeNull();
				expect(UUID_V4_REGEX.test(cookies.meetupTrack)).toBe(true);
			})
	);
});

