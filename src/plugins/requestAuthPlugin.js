import chalk from 'chalk';
import { Observable } from 'rxjs';

import { tryJSON } from '../util/fetchUtils';
import {
	applyAuthState,
	configureAuthCookies,
	getMemberCookieName,
	removeAuthState,
	setPluginState,
} from '../util/authUtils';

/**
 * @module requestAuthPlugin
 */

function verifyAuth(auth) {
	const keys = Object.keys(auth);
	if (!keys.length) {
		const errorMessage = 'No auth token(s) provided';
		console.error(
			chalk.red(errorMessage),
			': application can not fetch data.',
			'You might be able to recover by clearing cookies and refreshing'
		);
		throw new Error(errorMessage);
	}
	return auth;
}

const handleLogout = request => {
	const {
		id,
	} = request;
	console.log(JSON.stringify({
		message: 'Logout - clearing cookies',
		info: { id }
	}));
	return removeAuthState(
		[getMemberCookieName(request.server), 'oauth_token', 'refresh_token'],
		request,
		request.plugins.requestAuth.reply
	);
};

function getAuthType(request) {
	const memberCookie = getMemberCookieName(request.server);
	const allowedAuthTypes = [memberCookie, 'oauth_token'];
	// search for a request.state cookie name that matches an allowed auth type
	return allowedAuthTypes.reduce(
		(authType, allowedType) => authType || request.state[allowedType] && allowedType,
		null
	);
}

/**
 * Ensure that the passed-in Request contains a valid Oauth token
 *
 * If the Request already has a valid oauth token, it is returned unchanged,
 * otherwise the request is parsed for more info and a new token is set
 *
 * @param {Observable} requestAuthorizer$ a function that takes a request and emits new auth
 *   data
 * @param {Request} request Hapi request to modify with auth token (if necessary)
 * @return {Observable} Observable that emits the request with auth applied
 */
export const applyRequestAuthorizer$ = requestAuthorizer$ => request => {
	const {
		id,
		query,
		plugins,
	} = request;

// logout is accomplished exclusively through a `logout` querystring value
	if ('logout' in query) {
		handleLogout(request);
	}

	// always need oauth_token, even if it's an anonymous (pre-reg) token
	// This is 'deferred' because we don't want to start fetching the token
	// before we know that it's needed
	const authType = getAuthType(request);

	if (authType) {
		plugins.requestAuth.authType = authType;
		return Observable.of(request);
	}

	console.log(JSON.stringify({
		message: 'Request does not contain auth token',
		info: { id }
	}));
	return requestAuthorizer$(request)  // get anonymous oauth_token
		.do(applyAuthState(request, plugins.requestAuth.reply))
		.map(() => request);
};

/**
 * Get an anonymous code from the API that can be used to generate an oauth
 * access token
 *
 * @param {Object} config { OAUTH_AUTH_URL, oauth }
 * @param {String} redirect_uri Return url after anonymous grant
 */
export function getAnonymousCode$({ API_TIMEOUT=5000, OAUTH_AUTH_URL, oauth }, redirect_uri) {
	if (!oauth.key) {
		throw new ReferenceError('OAuth consumer key is required');
	}

	const authURL = new URL(OAUTH_AUTH_URL);
	authURL.searchParams.append('response_type', 'anonymous_code');
	authURL.searchParams.append('client_id', oauth.key);
	authURL.searchParams.append('redirect_uri', redirect_uri);
	const requestOpts = {
		method: 'GET',
		headers: {
			Accept: 'application/json'
		},
	};

	return Observable.defer(() => {
		console.log(JSON.stringify({
			message: `Outgoing request GET ${OAUTH_AUTH_URL}`,
			type: 'request',
			direction: 'out',
			info: {
				url: OAUTH_AUTH_URL,
				method: 'get',
			}
		}));

		const startTime = new Date();
		return Observable.fromPromise(fetch(authURL.toString(), requestOpts))
			.timeout(API_TIMEOUT)
			.do(() => {
				console.log(JSON.stringify({
					message: `Incoming response GET ${OAUTH_AUTH_URL}`,
					type: 'response',
					direction: 'in',
					info: {
						url: OAUTH_AUTH_URL,
						method: 'get',
						time: new Date() - startTime,
					}
				}));
			})
			.flatMap(tryJSON(OAUTH_AUTH_URL))
			.map(({ code }) => ({
				grant_type: 'anonymous_code',
				token: code
			}));
	});
}

/**
 * Curry the config to generate a function that receives a grant type and grant
 * token that can be used to generate an oauth access token from the API
 * @param {Object} config object containing the oauth secret and key
 * @param {String} redirect_uri Return url after anonymous grant
 * @param {Object} headers Hapi request headers for anonymous user request
 * @return {Object} the JSON-parsed response from the authorize endpoint
 *   - contains 'access_token', 'refresh_token'
 */
export const getAccessToken$ = ({ API_TIMEOUT=5000, OAUTH_ACCESS_URL, oauth }, redirect_uri) => {
	if (!oauth.key) {
		throw new ReferenceError('OAuth consumer key is required');
	}
	if (!oauth.secret) {
		throw new ReferenceError('OAuth consumer secret is required');
	}
	const params = {
		client_id: oauth.key,
		client_secret: oauth.secret,
		redirect_uri
	};
	return headers => {
		const requestOpts = {
			method: 'POST',
			headers: {
				Cookie: headers.cookie,
				Accept: headers.accept,
				'Accept-Language': headers['accept-language'],
				'Cache-Control': headers['cache-control']
			},
		};
		const accessUrl = Object.keys(params)
			.reduce((accessUrl, key) => {
				accessUrl.searchParams.append(key, params[key]);
				return accessUrl;
			}, new URL(OAUTH_ACCESS_URL));

		return ({ grant_type, token }) => {

			if (!token) {
				// programmer error or catastrophic auth failure - throw exception
				throw new ReferenceError('No grant token provided - cannot obtain access token');
			}

			accessUrl.searchParams.append('grant_type', grant_type);
			if (grant_type === 'anonymous_code') {
				accessUrl.searchParams.append('code', token);
			}
			if (grant_type === 'refresh_token') {
				accessUrl.searchParams.append('refresh_token', token);
			}

			console.log(JSON.stringify({
				message: `Outgoing request GET ${OAUTH_ACCESS_URL}?${grant_type}`,
				type: 'request',
				direction: 'out',
				info: {
					url: OAUTH_ACCESS_URL,
					method: 'get',
				}
			}));

			const startTime = new Date();
			return Observable.fromPromise(fetch(accessUrl.toString(), requestOpts))
				.timeout(API_TIMEOUT)
				.do(() => {
					console.log(JSON.stringify({
						message: `Incoming response GET ${OAUTH_ACCESS_URL}?${grant_type}`,
						type: 'response',
						direction: 'in',
						info: {
							url: OAUTH_ACCESS_URL,
							method: 'get',
							time: new Date() - startTime,
						}
					}));
				})
				.flatMap(tryJSON(OAUTH_ACCESS_URL));
		};
	};
};

const refreshToken$ = refresh_token => Observable.of({
	grant_type: 'refresh_token',
	token: refresh_token
});

/**
 * Curry a function that will get a new auth token for a passed-in request.
 * For an anonymous auth, the request header information is used to determine
 * the location and language of the anonymous member
 *
 * @param {Object} config { OAUTH_AUTH_URL, OAUTH_ACCESS_URL, oauth }
 * @param {Object} request the Hapi request that needs to be authorized
 */
export const getRequestAuthorizer$ = config => {
	const redirect_uri = 'http://www.meetup.com/';  // required param set in oauth consumer config
	const anonymousCode$ = getAnonymousCode$(config, redirect_uri);
	const accessToken$ = getAccessToken$(config, redirect_uri);

	// if the request has a refresh_token, use it. Otherwise, get a new anonymous access token
	return ({ headers, state: { refresh_token} }) =>
		Observable.if(
			() => refresh_token,
			refreshToken$(refresh_token),
			anonymousCode$
		)
		.flatMap(accessToken$(headers))
		.do(verifyAuth);
};

export const getAuthenticate = authorizeRequest$ => (request, reply) => {
	const { id } = request;
	console.log(JSON.stringify({
		message: 'Authenticating request',
		info: { id }
	}));
	return authorizeRequest$(request)
		.do(request => {
			console.log(JSON.stringify({
				message: 'Request authenticated',
				info: { id }
			}));
		})
		.subscribe(
			request => {
				const credentials = request.state[getAuthType(request)] ||
					request.plugins.requestAuth.oauth_token;
				reply.continue({ credentials, artifacts: credentials });
			},
			err => reply(err, null, { credentials: null })
		);
};

/**
 * Request authorizing scheme
 *
 * 1. assign a reference to the reply interface on request.plugins.requestAuth
 * 2. make sure the correct MEETUP_MEMBER[_DEV] cookie is used for auth
 * 3. return the authentication function from getAuthenticate, which ensures
 * that all requests have valid auth credentials (anonymous or logged in)
 *
 * https://hapijs.com/api#serverauthschemename-scheme
 * https://hapijs.com/api#serverauthstrategyname-scheme-mode-options
 *
 * @param {Object} server the Hapi app server instance
 * @param {Object} options the options passed to `server.auth.strategy`for the
 *   auth stategy instance
 */
export const oauthScheme = server => {
	configureAuthCookies(server);       // apply default config for auth cookies
	server.ext('onPreAuth', setPluginState);     // provide a reference to `reply` on the request
	const options = server.plugins.requestAuth.config;
	const authorizeRequest$ = applyRequestAuthorizer$(getRequestAuthorizer$(options));

	return {
		authenticate: getAuthenticate(authorizeRequest$),
	};
};
/**
 * This plugin does two things.
 *
 * 1. Adds an 'authorize' interface on the Hapi `request`, which ensures that
 * the request has an oauth_token cookie - it provides an anonymous token when
 * none is provided in the request, and refreshes a token that has expired
 * 2. Adds a new route that returns the auth JSON containing the new oauth_token
 * (configurable, defaults to '/auth')
 *
 * {@link http://hapijs.com/tutorials/plugins}
 */
export default function register(server, options, next) {
	// allow plugin to access config at server.plugins.requestAuth.config
	server.expose('config', options);

	// register the plugin's auth scheme
	server.auth.scheme('oauth', oauthScheme);

	next();
}
register.attributes = {
	name: 'requestAuth',
	version: '1.0.0',
};

