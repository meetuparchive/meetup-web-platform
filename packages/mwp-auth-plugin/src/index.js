import uuid from 'uuid';

// hardcoded logged-out cookies with valid signatures that can be used for any logged-out API request
const mockCookies = {
	MEETUP_MEMBER:
		'"id=0&status=1&timestamp=1512421401&bs=0&tz=US%2FEastern&zip=&country=us&city=&state=&lat=0.0&lon=0.0&ql=false&s=6e59e217276406a3391fed92744dbb08d356bc34&scope=ALL"',
	MEETUP_MEMBER_DEV:
		'"id=0&status=1&timestamp=1512434160&bs=0&tz=US%2FEastern&zip=&country=us&city=&state=&lat=0.0&lon=0.0&ql=false&s=2006a4cfd308fcc675fddf9e2d4247ff29a187a3&scope=ALL"',
};

/**
 * Request authorizing scheme
 *
 * request.auth.credentials will be set to a member cookie. If the incoming
 * request does not have a member cookie, a mocked logged-out cookie will be
 * used. This plugin does _not_ set a cookie on the response.
 * @param {Object} server the Hapi app server instance
 * @param {Object} options the options passed to `server.auth.strategy`for the
 *   auth stategy instance
 */
export const mwpScheme = server => {
	const MEMBER_COOKIE_NAME = server.settings.app.api.isProd
		? 'MEETUP_MEMBER'
		: 'MEETUP_MEMBER_DEV';
	const CSRF_COOKIE_NAME = server.settings.app.api.isProd
		? 'MEETUP_CSRF'
		: 'MEETUP_CSRF_DEV';

	// authenticate function takes (request, reply) and eventually calls
	// `reply.continue({ credentials })`, where credentials === { memberCookie, csrfToken }
	// 1. check for meetup_member(_dev) cookie
	// 2. if none, credentials are provided by mock logged out cookie
	// 3. check for csrf cookie
	// 4. if none, generate a new UUID value
	// 5. return { memberCookie, csrfToken }

	return {
		authenticate: (request, reply) => {
			const csrfToken = request.state[CSRF_COOKIE_NAME] || uuid.v4();
			const memberCookie =
				request.state[MEMBER_COOKIE_NAME] || mockCookies[MEMBER_COOKIE_NAME];
			const credentials = {
				memberCookie,
				csrfToken,
			};
			reply.continue({ credentials });
		},
	};
};

export function register(server, options) {
	// register the plugin's auth scheme
	server.auth.scheme('mwp', mwpScheme);
}

exports.plugin = {
	register,
	name: 'mwp-auth',
	version: '1.0.0',
};
