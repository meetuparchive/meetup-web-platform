import Boom from 'boom';
import chalk from 'chalk';
import Rx from 'rxjs';

/**
 * @module anonAuthPlugin
 */

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

function injectAuthIntoRequest([request, auth]) {
	// update request with auth info
	request.state.oauth_token = auth.access_token;  // this endpoint provides 'access_token' instead of 'oauth_token'
	request.state.refresh_token = auth.refresh_token;  // use to get new oauth upon expiration
	request.state.expires_in = auth.expires_in;  // TTL for oauth token (in seconds)
	request.state.anonymous = true;

	// special prop in `request.app` to indicate that this is a new,
	// server-provided token, not from the original request, so the cookies
	// will need to be set in the response
	request.app.setCookies = true;
}

/**
 * Curry a function that uses a pre-configured anonymous auth stream to ensure
 * that the passed-in Request contains a valid Oauth token
 *
 * If the Request already has a valid oauth token, it is returned unchanged
 *
 * @param {Observable} auth$ a configured anonymous auth stream from `anonAuth$(config)`
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
		request$,
		request$
			.zip(deferredAuth$)
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

	return () => {
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
	};
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
export const getAnonymousAccessToken$ = ({ API_TIMEOUT=5000, ANONYMOUS_ACCESS_URL, oauth }, redirect_uri) => {
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
				accessParams.append('code', token);
			}
			if (grant_type === 'refresh_token') {
				accessParams.append('refresh_token', token);
			}

			const url = `${ANONYMOUS_ACCESS_URL}?${accessParams}`;

			console.log(`Fetching anonymous access_token from ${ANONYMOUS_ACCESS_URL}`);
			return Rx.Observable.fromPromise(fetch(url, requestOpts))
				.timeout(API_TIMEOUT)
				.flatMap(tryJSON);
		};
	};
};

/**
 * Curry a function that will get an anonymous auth token for a passed-in request
 * The request header information is used to determine the location and language of the
 * expected anonymous member
 *
 * @param {Object} config { ANONYMOUS_AUTH_URL, ANONYMOUS_ACCESS_URL, oauth }
 * @param {String} redirect_uri this will be ignored since we get the code async,
 * but it must be within the domain registered with the app's oauth consumer
 * config (currently http://www.meetup.com)
 * @param {Object} headers these headers are mainly used to pass along the
 * language setting of the browser so that the anonymous token will access
 * translated API content
 */
export const anonAuth$ = config => {
	const redirect_uri = 'http://www.meetup.com/';  // required param set in oauth consumer config
	const code$ = getAnonymousCode$(config, redirect_uri);
	const token$ = getAnonymousAccessToken$(config, redirect_uri);

	// if the request has a refresh_token, use it. Otherwise, get a new anonymous code
	return request => Rx.Observable.if(
		() => request.state.refresh_token,
		Rx.Observable.of({
			grant_type: 'refresh_token',
			token: request.state.refresh_token
		}),
		code$()
	)
	.flatMap(token$(request.headers))
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
	// create a single anonAuth$ stream that can be used by any route
	const auth$ = anonAuth$(options);
	// create a single stream for modifying an arbitrary request with anonymous auth
	const authorizeRequest$ = requestAuthorizer(auth$);

	server.decorate(
		'request',
		'authorize',
		request => () => authorizeRequest$(request),
		{ apply: true }
	);

	server.route({
		method: 'GET',
		path: options.ANONYMOUS_AUTH_APP_PATH,
		handler: (request, reply) => {
			auth$(request).subscribe(
				auth => {
					reply(JSON.stringify(auth)).type('application/json');
				},
				(err) => { reply(Boom.badImplementation(err.message)); }
			);
		}
	});

	next();
}
register.attributes = {
	name: 'anonAuth',
	version: '1.0.0',
};

