import chalk from 'chalk';
import Rx from 'rxjs';

import { tryJSON } from '../util/fetchUtils';
import { applyAuthState, removeAuthState } from '../util/authUtils';

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
	request.log(['info', 'auth'], 'Logout received, clearing cookies to re-authenticate');
	return removeAuthState(['oauth_token', 'refresh_token'], request, request.authorize.reply);
};

/**
 * Ensure that the passed-in Request contains a valid Oauth token
 *
 * If the Request already has a valid oauth token, it is returned unchanged,
 * otherwise the request is parsed for more info and a new token is set
 *
 * @param {Observable} auth$ a function that takes a request and emits new auth
 *   data
 * @param {Request} request Hapi request to modify with auth token (if necessary)
 * @return {Observable} Observable that emits the request with auth applied
 */
export const requestAuthorizer = auth$ => request => {
	// logout is accomplished exclusively through a `logout` querystring value
	if ('logout' in request.query) {
		handleLogout(request);
	}

	// always need oauth_token, even if it's an anonymous (pre-reg) token
	// This is 'deferred' because we don't want to start fetching the token
	// before we know that it's needed
	const request$ = Rx.Observable.of(request);
	const authType = request.state.oauth_token && 'cookie';

	request.log(['info', 'auth'], 'Checking for oauth_token in request');
	return Rx.Observable.if(
		() => authType,
		request$
			.do(() => request.log(['info', 'auth'], `Request contains auth token (${authType})`)),
		request$
			.do(() => request.log(['info', 'auth'], 'Request does not contain auth token'))
			.flatMap(request => auth$(request).do(applyAuthState(request, request.authorize.reply)).map(() => request))
	);
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

	const authParams = new URLSearchParams();
	authParams.append('response_type', 'anonymous_code');
	authParams.append('client_id', oauth.key);
	authParams.append('redirect_uri', redirect_uri);
	const authURL = `${OAUTH_AUTH_URL}?${authParams}`;
	const requestOpts = {
		method: 'GET',
		headers: {
			Accept: 'application/json'
		},
	};

	return Rx.Observable.defer(() => {
		console.log(`Fetching anonymous auth code from ${OAUTH_AUTH_URL}`);
		return Rx.Observable.fromPromise(fetch(authURL, requestOpts))
			.timeout(API_TIMEOUT)
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
		const accessParams = Object.keys(params)
			.reduce((accessParams, key) => {
				accessParams.append(key, params[key]);
				return accessParams;
			}, new URLSearchParams());

		return ({ grant_type, token }) => {

			if (!token) {
				// programmer error or catastrophic auth failure - throw exception
				throw new ReferenceError('No grant token provided - cannot obtain access token');
			}

			accessParams.append('grant_type', grant_type);
			if (grant_type === 'anonymous_code') {
				console.log(`Fetching anonymous access_token from ${OAUTH_ACCESS_URL}`);
				accessParams.append('code', token);
			}
			if (grant_type === 'refresh_token') {
				console.log(`Refreshing access_token from ${OAUTH_ACCESS_URL}`);
				accessParams.append('refresh_token', token);
			}

			const url = `${OAUTH_ACCESS_URL}?${accessParams}`;

			return Rx.Observable.fromPromise(fetch(url, requestOpts))
				.timeout(API_TIMEOUT)
				.flatMap(tryJSON(OAUTH_ACCESS_URL));
		};
	};
};

const refreshToken$ = refresh_token => Rx.Observable.of({
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
export const requestAuth$ = config => {
	const redirect_uri = 'http://www.meetup.com/';  // required param set in oauth consumer config
	const anonymousCode$ = getAnonymousCode$(config, redirect_uri);
	const accessToken$ = getAccessToken$(config, redirect_uri);

	// if the request has a refresh_token, use it. Otherwise, get a new anonymous access token
	return ({ headers, state: { refresh_token} }) =>
		Rx.Observable.if(
			() => refresh_token,
			refreshToken$(refresh_token),
			anonymousCode$
		)
		.flatMap(accessToken$(headers))
		.do(verifyAuth);
};

export const authenticate = (request, reply) => {
	request.log(['info', 'auth'], 'Authenticating request');
	return request.authorize()
		.do(request => {
			request.log(['info', 'auth'], 'Request authenticated');
		})
		.subscribe(({ state: { oauth_token } }) => {
			const credentials = oauth_token;
			reply.continue({ credentials, artifacts: credentials });
		});
};

/**
 * Request authorizing scheme
 *
 * 1. add a `.authorize` method to the request
 * 2. assign a reference to the reply interface on request.authorize
 * 3. add an anonymous-user-JSON-generating route (for app logout)
 * 4. return the authentication function, which ensures that all requests have
 * valid auth credentials (anonymous or logged in)
 */
export const oauthScheme = (server, options) => {
	// create a single requestAuth$ stream that can be used by any route
	const auth$ = requestAuth$(options);
	// create a single stream for modifying an arbitrary request with anonymous auth
	const authorizeRequest$ = requestAuthorizer(auth$);

	server.decorate(
		'request',
		'authorize',
		request => () => authorizeRequest$(request),
		{ apply: true }
	);

	server.ext('onPreAuth', (request, reply) => {
		// Used for setting and unsetting state, not for replying to request
		request.authorize.reply = reply;

		return reply.continue();
	});

	return { authenticate };
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
	server.auth.scheme('oauth', oauthScheme);
	next();
}
register.attributes = {
	name: 'requestAuth',
	version: '1.0.0',
};

