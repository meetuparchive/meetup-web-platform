/**
 * @module authUtils
 */

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

/**
 * Transform auth info from the API into a configuration for the corresponding
 * cookies to write into the Hapi request/response
 *
 * @param {Object} auth { oauth_token || access_token, refresh_token, expires_in }
 * object from API/Auth endpoint
 */
export const configureAuthState = auth => {
	const path = '/';
	return {
		oauth_token: {
			value: auth.oauth_token || auth.access_token,
			opts: {
				path,
				ttl: auth.expires_in * 1000,
				isHttpOnly: true,
			},
		},
		refresh_token: {
			value: auth.refresh_token,
			opts: {
				path,
				ttl: YEAR_IN_MS * 2,
				isHttpOnly: true,
			},
		}
	};
};

/**
 * Both the incoming request and the outgoing response need to have an
 * 'authorized' state in order for the app to render correctly with data from
 * the API, so this function modifies the request and the reply
 *
 * @param request Hapi request
 * @param auth { oauth_token || access_token, expires_in (seconds), refresh_token }
 */
export const applyAuthState = (request, reply) => auth => {
	// there are secret tokens in `auth`, be careful with logging
	const authState = configureAuthState(auth);
	const authCookies = Object.keys(authState);

	request.log(['auth', 'info'], `Setting auth cookies: ${JSON.stringify(authCookies)}`);
	Object.keys(authState).forEach(name => {
		const cookieVal = authState[name];
		// apply to request
		request.state[name] = cookieVal.value;
		// apply to response - note this special `request.authorize.reply` prop assigned onPreAuth
		reply.state(name, cookieVal.value, cookieVal.opts);
	});
	return request;
};

export const removeAuthState = (names, request, reply) => {
	names.forEach(name => {
		request.state[name] = null;
		reply.unstate(name);
	});
};


