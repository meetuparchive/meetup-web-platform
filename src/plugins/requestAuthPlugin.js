import Boom from 'boom';
import chalk from 'chalk';
import Rx from 'rxjs';

/**
 * @module anonAuthPlugin
 */

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

function tryJSON(response) {
	const { status } = response;
	if (status >= 400) {  // status always 200: bugzilla #52128
		throw new Error(`API responded with error code ${status}`);
	}
	return response.text().then(text => JSON.parse(text));
}

function verifyAuth([request, auth]) {
	const keys = Object.keys(auth);
	if (!keys.length) {
		const errorMessage = 'No auth info provided';
		console.error(
			chalk.red(errorMessage),
			': application can not fetch data.',
			'You might be able to recover by clearing cookies and refreshing'
		);
		throw new Error(errorMessage);
	}
	// there are secret tokens in `auth`, be careful with logging
	request.log(['auth'], `Authorizing with keys: ${JSON.stringify(keys)}`);
}

const injectAuthIntoRequest = ([request, auth]) => {
	const path = '/';
	request.plugins.requestAuth = {
		oauth_token: {
			value: auth.oauth_token || auth.access_token,
			opts: { path, ttl: auth.expires_in * 1000 },
		},
		refresh_token: {
			value: auth.refresh_token,
			opts: { path, ttl: YEAR_IN_MS * 2 },
		},
		anonymous: {
			value: auth.anonymous.toString(),
			opts: { path, ttl: YEAR_IN_MS * 2 }
		},
	};
};

/**
 * Curry a function that uses a pre-configured anonymous auth stream to ensure
 * that the passed-in Request contains a valid Oauth token
 *
 * If the Request already has a valid oauth token, it is returned unchanged
 *
 * @param {Observable} auth$ a configured anonymous auth stream from `provideAuth$(config)`
 * @param {Request} request Hapi request to modify with auth token (if necessary)
 */
export const requestAuthorizer = auth$ => request => {
	// always need oauth_token, even if it's an anonymous (pre-reg) token
	// This is 'deferred' because we don't want to start fetching the token
	// before we know that it's needed
	const deferredAuth$ = Rx.Observable.defer(
		() => auth$(request)
	);

	const request$ = Rx.Observable.of(request);
	return Rx.Observable.if(
		() => request.state.oauth_token,
		request$,  // no problem, request is authorized
		request$
			.zip(deferredAuth$)  // need to get a new token
			.do(verifyAuth)
			.do(injectAuthIntoRequest)
			.map(([request, auth]) => request)  // throw away auth info
	);
};

/**
 * Get an anonymous code from the API that can be used to generate an oauth
 * access token
 *
 * @param {Object} config { ANONYMOUS_AUTH_URL, oauth }
 * @param {String} redirect_uri Return url after anonymous grant
 */
export function getAnonymousCode$({ API_TIMEOUT=5000, ANONYMOUS_AUTH_URL, oauth }, redirect_uri) {
	if (!oauth.key) {
		throw new ReferenceError('OAuth consumer key is required');
	}

	const authParams = new URLSearchParams();
	authParams.append('response_type', 'anonymous_code');
	authParams.append('client_id', oauth.key);
	authParams.append('redirect_uri', redirect_uri);
	const anonymousCodeUrl = `${ANONYMOUS_AUTH_URL}?${authParams}`;
	const requestOpts = {
		method: 'GET',
		headers: {
			Accept: 'application/json'
		},
	};

	return Rx.Observable.defer(() => {
		console.log(`Fetching anonymous auth code from ${ANONYMOUS_AUTH_URL}`);
		return Rx.Observable.fromPromise(fetch(anonymousCodeUrl, requestOpts))
			.timeout(API_TIMEOUT)
			.flatMap(tryJSON)
			.catch(error => {
				console.log(error.stack);
				return Rx.Observable.of({ code: null });
			})
			.map(({ code }) => ({
				grant_type: 'anonymous_code',
				token: code
			}));
	});
}

/**
 * Curry the config to generate a function that consumes an anonymous
 * code and returns an oauth access token from the API
 * @param {Object} config object containing the oauth secret and key
 * @param {String} redirect_uri Return url after anonymous grant
 * @param {Object} headers Hapi request headers for anonymous user request
 * @return {Object} the JSON-parsed response from the authorize endpoint
 *   - contains 'access_token', 'refresh_token'
 */
export const getAccessToken$ = ({ API_TIMEOUT=5000, ANONYMOUS_ACCESS_URL, oauth }, redirect_uri) => {
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
				Cookie: headers['cookie'],
				Accept: headers['accept'],
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
				throw new ReferenceError('No auth code provided - cannot obtain access token');
			}

			accessParams.append('grant_type', grant_type);
			if (grant_type === 'anonymous_code') {
				console.log(`Fetching anonymous access_token from ${ANONYMOUS_ACCESS_URL}`);
				accessParams.append('code', token);
			}
			if (grant_type === 'refresh_token') {
				console.log(`Refreshing access_token from ${ANONYMOUS_ACCESS_URL}`);
				accessParams.append('refresh_token', token);
			}

			const url = `${ANONYMOUS_ACCESS_URL}?${accessParams}`;

			return Rx.Observable.fromPromise(fetch(url, requestOpts))
				.timeout(API_TIMEOUT)
				.flatMap(tryJSON);
		};
	};
};

const refreshToken$ = (refresh_token) => Rx.Observable.of({
	grant_type: 'refresh_token',
	token: refresh_token
});

/**
 * Curry a function that will get a new auth token for a passed-in request
 * The request header information is used to determine the location and language of the
 * expected anonymous member. The new auth token may be for an anonymous or
 * logged-in member if a refresh_token is present.
 *
 * @param {Object} config { ANONYMOUS_AUTH_URL, ANONYMOUS_ACCESS_URL, oauth }
 * @param {String} redirect_uri this will be ignored since we get the code async,
 * but it must be within the domain registered with the app's oauth consumer
 * config (currently http://www.meetup.com)
 * @param {Object} headers these headers are mainly used to pass along the
 * language setting of the browser so that the anonymous token will access
 * translated API content
 */
export const provideAuth$ = config => {
	const redirect_uri = 'http://www.meetup.com/';  // required param set in oauth consumer config
	const anonymousCode$ = getAnonymousCode$(config, redirect_uri);
	const accessToken$ = getAccessToken$(config, redirect_uri);

	// if the request has a refresh_token, use it. Otherwise, get a new anonymous code
	return ({ headers, state: { refresh_token} }) => Rx.Observable.if(
		() => refresh_token,
		refreshToken$(refresh_token),
		anonymousCode$
	)
	.flatMap(accessToken$(headers))
	.retry(2)  // might be a temporary problem
	.catch(error => {
		console.log(error.stack);
		return Rx.Observable.of({});  // failure results in empty object response - bad time
	});
};

/**
 * This plugin does two things.
 *
 * 1. Adds an 'authorize' interface on the Hapi `request`, which ensures that
 * the request has an oauth_token cookie - it provides an anonymous token when
 * none is provided in the request
 * 2. Adds a new route that returns the anonymous auth JSON containing an
 * anonymous oauth_token (configurable, defaults to '/anon')
 *
 * {@link http://hapijs.com/tutorials/plugins}
 */
export default function register(server, options, next) {
	// create a single provideAuth$ stream that can be used by any route
	const auth$ = provideAuth$(options);
	// create a single stream for modifying an arbitrary request with anonymous auth
	const authorizeRequest$ = requestAuthorizer(auth$);

	server.decorate(
		'request',
		'authorize',
		request => () => authorizeRequest$(request),
		{ apply: true }
	);

	server.handler('auth', (route, options) => (request, reply) =>
		request.authorize()
			.flatMap(request => options.handler(request, reply))
			.do(() => {
				const { requestAuth } = request.plugins;
				for (const cookie in requestAuth) {
					request.log(['info'], chalk.green(`Setting cookie ${cookie}`));
					reply.state(
						cookie,
						requestAuth[cookie].value,
						requestAuth[cookie].opts
					);
				}
			})
			.subscribe(() => {}, err => { console.error(err.message); })
	);

	server.route({
		method: 'GET',
		path: options.AUTH_ENDPOINT,
		handler: (request, reply) => {
			auth$(request).subscribe(
				auth => {
					const response = reply(JSON.stringify(auth))
						.type('application/json');
					reply.track(response, 'logout');
				},
				(err) => { reply(Boom.badImplementation(err.message)); }
			);
		}
	});

	next();
}
register.attributes = {
	name: 'requestAuth',
	version: '1.0.0',
};

