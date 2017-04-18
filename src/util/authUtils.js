import Joi from 'joi';

import config from './config';

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
	return {
		oauth_token: {
			value: auth.oauth_token || auth.access_token || '',
			opts: {
				ttl: (auth.expires_in || 0) * 1000,
			},
		},
		refresh_token: {
			value: auth.refresh_token,
			opts: {
				ttl: YEAR_IN_MS * 2,
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

	const { id } = request;
	console.log(JSON.stringify({
		message: `Setting auth cookies: ${JSON.stringify(authCookies)}`,
		info: { id }
	}));
	Object.keys(authState).forEach(name => {
		const cookieVal = authState[name];
		// apply to request
		request.plugins.requestAuth[name] = cookieVal.value;  // this will only be used for generating internal requests
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

export function validateSecret(secret) {
	const { value, error } = Joi.validate(secret, Joi.string().min(32).required());
	if (error) {
		throw error;
	}
	return value;
}

export const getMemberCookieName = server =>
	server.app.isDevConfig ? 'MEETUP_MEMBER_DEV' : 'MEETUP_MEMBER';

/**
 * apply default cookie options for auth-related cookies
 */
export const configureAuthCookies = server => {
	const password = validateSecret(server.plugins.requestAuth.config.COOKIE_ENCRYPT_SECRET);
	const isSecure = config.get('isProd');
	const authCookieOptions = {
		encoding: 'iron',
		password,
		isSecure,
		path: '/',
		isHttpOnly: true,
		clearInvalid: true,
	};
	server.state('oauth_token', authCookieOptions);
	server.state('refresh_token', authCookieOptions);
	server.state(getMemberCookieName(server), { isSecure, isHttpOnly: true });
};

export const setPluginState = (request, reply) => {
	// Used for setting and unsetting state, not for replying to request
	request.plugins.requestAuth = {
		reply,
	};

	return reply.continue();
};

