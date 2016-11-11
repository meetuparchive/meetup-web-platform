import Boom from 'boom';
import chalk from 'chalk';
import Rx from 'rxjs';

/**
 * @module requestAuthPlugin
 */

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

const tryJSON = reqUrl => response => {
	const { status, statusText } = response;
	if (status >= 400) {  // status always 200: bugzilla #52128
		throw new Error(`Request to ${reqUrl} responded with error code ${status}: ${statusText}`);
	}
	return response.text().then(text => JSON.parse(text));
};

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
	request.log(['info', 'auth'], `Authorizing with keys: ${JSON.stringify(keys)}`);
}

/**
 * Both the incoming request and the outgoing response need to have an
 * 'authorized' state in order for the app to render correctly with data from
 * the API, so this function modifies the request and the reply
 */
const injectAuthIntoRequest = ([request, auth]) => {
	const path = '/';
	const authState = {
		oauth_token: {
			value: auth.oauth_token || auth.access_token,
			opts: { path, ttl: auth.expires_in * 1000 },
		},
		refresh_token: {
			value: auth.refresh_token,
			opts: { path, ttl: YEAR_IN_MS * 2 },
		}
	};
	Object.keys(authState).forEach(name => {
		const cookieVal = authState[name];
		request.state[name] = cookieVal.value;  // apply to request
		request.authorize.reply.state(name, cookieVal.value, cookieVal.opts);  // apply to response
	});
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
	// always need oauth_token, even if it's an anonymous (pre-reg) token
	// This is 'deferred' because we don't want to start fetching the token
	// before we know that it's needed
	const deferredAuth$ = Rx.Observable.defer(() => auth$(request));
	const request$ = Rx.Observable.of(request);
	const authType = request.state.oauth_token && 'cookie' ||
		request.headers.authorization && 'header' ||
		false;

	request.log(['info', 'auth'], 'Checking for oauth_token in request');
	return Rx.Observable.if(
		() => authType,
		request$
			.do(() => request.log(['info', 'auth'], `Request contains auth token (${authType})`)),
		request$
			.do(() => request.log(['info', 'auth'], 'Request does not contain auth token'))
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

const refreshToken$ = (refresh_token) => Rx.Observable.of({
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
	return ({ headers, state: { refresh_token} }) => Rx.Observable.if(
		() => refresh_token,
		refreshToken$(refresh_token),
		anonymousCode$
	)
	.flatMap(accessToken$(headers))
	.catch(error => {
		console.log(error.stack);
		return Rx.Observable.of({});  // failure results in empty object response - bad time
	});
};

const oauthScheme = (server, options) => ({
	authenticate: (request, reply) => {
		request.log(['info', 'auth'], 'Authenticating request');
		request.authorize()
			.do(request => {
				request.log(['info', 'auth'], 'Request authenticated');
			})
			.subscribe(({ state: { oauth_token }, headers: { authorization } }) => {
				const credentials = oauth_token || authorization.replace('Bearer ', '');
				reply.continue({ credentials, artifacts: credentials });
			});
	},
});
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
	server.auth.scheme('oauth', oauthScheme);

	server.route({
		method: 'GET',
		path: options.AUTH_ENDPOINT,
		config: { auth: false },
		handler: (request, reply) => {
			request.log(['info', 'auth'], 'Handling an auth endpoint request');
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

