import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/if';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';

import logger from 'mwp-core/lib/util/logger';
import { MEMBER_COOKIE } from 'mwp-core/lib/util/cookieUtils';
import {
	applyAuthState,
	configureAuthCookies,
	setPluginState,
} from 'mwp-core/lib/util/authUtils';

/**
 * @module requestAuthPlugin
 */

/**
 * Attempt to JSON parse a Response object from a fetch call
 *
 * @param {String} reqUrl the URL that was requested
 * @param {Response} response the fetch Response object
 * @return {Promise} a Promise that resolves with the JSON-parsed text
 */
export const tryJSON = reqUrl => response => {
	const { status, statusText } = response;
	if (status >= 400) {
		// status always 200: bugzilla #52128
		return Promise.reject(
			new Error(
				`Request to ${reqUrl} responded with error code ${status}: ${statusText}`
			)
		);
	}
	return response.text().then(text => JSON.parse(text));
};

const verifyAuth = logger => auth => {
	if (!Object.keys(auth).length) {
		const errorMessage = 'No auth token(s) provided';
		logger.fatal(
			errorMessage,
			': application can not fetch data.',
			'You might be able to recover by clearing cookies and refreshing'
		);
		throw new Error(errorMessage);
	}
};

function getAuthType(request) {
	const allowedAuthTypes = [MEMBER_COOKIE, 'oauth_token'];
	// search for a request.state cookie name that matches an allowed auth type
	return allowedAuthTypes.reduce(
		(authType, allowedType) =>
			authType || (request.state[allowedType] && allowedType),
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
	const { plugins, server: { app: { logger } }, raw: { req } } = request;

	// always need oauth_token, even if it's an anonymous (pre-reg) token
	// This is 'deferred' because we don't want to start fetching the token
	// before we know that it's needed
	const authType = getAuthType(request);

	if (authType) {
		plugins.requestAuth.authType = authType;
		return Observable.of(request);
	}

	logger.warn({ req }, 'Request does not contain auth token');
	return requestAuthorizer$(request) // get anonymous oauth_token
		.do(applyAuthState(request, plugins.requestAuth.reply))
		.map(() => request);
};

/**
 * Get an anonymous code from the API that can be used to generate an oauth
 * access token
 *
 * @param {Object} serverAppConfig the Hapi `server.settings.app` object
 * @param {String} redirect_uri Return url after anonymous grant
 */
export function getAnonymousCode$(serverAppConfig, redirect_uri) {
	if (!serverAppConfig.oauth.key) {
		throw new ReferenceError('OAuth consumer key is required');
	}

	const authURL = new URL(serverAppConfig.oauth.auth_url);
	authURL.searchParams.append('response_type', 'anonymous_code');
	authURL.searchParams.append('client_id', serverAppConfig.oauth.key);
	authURL.searchParams.append('redirect_uri', redirect_uri);
	const requestOpts = {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
	};

	return Observable.defer(() => {
		logger.info(
			{
				type: 'request',
				direction: 'out',
				info: {
					url: serverAppConfig.oauth.auth_url,
					method: 'get',
				},
			},
			`Outgoing request GET ${serverAppConfig.oauth.auth_url}`
		);

		const startTime = new Date();
		return Observable.fromPromise(fetch(authURL.toString(), requestOpts))
			.timeout(serverAppConfig.api.timeout)
			.do(() => {
				logger.info(
					{
						type: 'response',
						direction: 'in',
						info: {
							url: serverAppConfig.oauth.auth_url,
							method: 'get',
							responseTime: new Date() - startTime,
						},
					},
					`Incoming response GET ${serverAppConfig.oauth.auth_url}`
				);
			})
			.mergeMap(tryJSON(serverAppConfig.oauth.auth_url))
			.map(({ code }) => ({
				grant_type: 'anonymous_code',
				token: code,
			}));
	});
}

/**
 * Generate a function that receives a grant type and grant
 * token that can be used to generate an oauth access token from the API
 *
 * @param {Object} serverAppConfig the Hapi `server.settings.app` config object
 * @param {String} redirect_uri Return url after anonymous grant
 *
 * @return {Object} the JSON-parsed response from the authorize endpoint
 *   - contains 'access_token', 'refresh_token'
 */
export const getAccessToken$ = (serverAppConfig, redirect_uri) => {
	if (!serverAppConfig.oauth.key) {
		throw new ReferenceError('OAuth consumer key is required');
	}
	if (!serverAppConfig.oauth.secret) {
		throw new ReferenceError('OAuth consumer secret is required');
	}
	const params = {
		client_id: serverAppConfig.oauth.key,
		client_secret: serverAppConfig.oauth.secret,
		redirect_uri,
	};
	return headers => {
		const requestOpts = {
			method: 'POST',
			headers: {
				Cookie: headers.cookie,
				Accept: headers.accept,
				'Accept-Language': headers['accept-language'],
				'Cache-Control': headers['cache-control'],
			},
		};
		const accessUrl = Object.keys(params).reduce((accessUrl, key) => {
			accessUrl.searchParams.append(key, params[key]);
			return accessUrl;
		}, new URL(serverAppConfig.oauth.access_url));

		return ({ grant_type, token }) => {
			if (!token) {
				// programmer error or catastrophic auth failure - throw exception
				throw new ReferenceError(
					'No grant token provided - cannot obtain access token'
				);
			}

			accessUrl.searchParams.append('grant_type', grant_type);
			if (grant_type === 'anonymous_code') {
				accessUrl.searchParams.append('code', token);
			}
			if (grant_type === 'refresh_token') {
				accessUrl.searchParams.append('refresh_token', token);
			}

			logger.info(
				{
					type: 'request',
					direction: 'out',
					info: {
						url: serverAppConfig.oauth.access_url,
						method: 'get',
					},
				},
				`Outgoing request GET ${serverAppConfig.oauth.access_url}?${grant_type}`
			);

			const startTime = new Date();
			return Observable.fromPromise(fetch(accessUrl.toString(), requestOpts))
				.timeout(serverAppConfig.api.timeout)
				.do(() => {
					logger.info(
						{
							type: 'response',
							direction: 'in',
							info: {
								url: serverAppConfig.oauth.access_url,
								method: 'get',
								responseTime: new Date() - startTime,
							},
						},
						`Incoming response GET ${serverAppConfig.oauth
							.access_url}?${grant_type}`
					);
				})
				.mergeMap(tryJSON(serverAppConfig.oauth.access_url));
		};
	};
};

const refreshToken$ = refresh_token =>
	Observable.of({
		grant_type: 'refresh_token',
		token: refresh_token,
	});

/**
 * Curry a function that will get a new auth token for a passed-in request.
 * For an anonymous auth, the request header information is used to determine
 * the location and language of the anonymous member
 *
 * @param {Object} serverAppConfig the Hapi `server.settings.app` config object
 */
export const getRequestAuthorizer$ = serverAppConfig => {
	const redirect_uri = 'http://www.meetup.com/'; // required param set in oauth consumer config
	const anonymousCode$ = getAnonymousCode$(serverAppConfig, redirect_uri);
	const accessToken$ = getAccessToken$(serverAppConfig, redirect_uri);

	// if the request has a refresh_token, use it. Otherwise, get a new anonymous access token
	return ({ headers, state: { refresh_token }, server: { app: { logger } } }) =>
		Observable.if(
			() => refresh_token,
			refreshToken$(refresh_token),
			anonymousCode$
		)
			.mergeMap(accessToken$(headers))
			.do(verifyAuth(logger));
};

export const getAuthenticate = authorizeRequest$ => (request, reply) => {
	const { server: { app: { logger } }, raw: { req } } = request;
	logger.debug({ req }, 'Authenticating request');
	return authorizeRequest$(request)
		.do(request => {
			logger.debug({ req }, 'Request authenticated');
		})
		.subscribe(
			request => {
				const credentials =
					request.state[getAuthType(request)] ||
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
	// apply default config for auth cookies
	configureAuthCookies(server);

	// provide a reference to `reply` on the request
	server.ext('onPreAuth', setPluginState);

	const authorizeRequest$ = applyRequestAuthorizer$(
		getRequestAuthorizer$(server.settings.app)
	);

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
	// register the plugin's auth scheme
	server.auth.scheme('oauth', oauthScheme);

	next();
}

register.attributes = {
	name: 'requestAuth',
	version: '1.0.0',
};
