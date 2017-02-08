import querystring from 'qs';
import url from 'url';
import uuid from 'uuid';

import externalRequest from 'request';
import Joi from 'joi';
import Rx from 'rxjs';

import {
	removeAuthState,
} from './authUtils';
import {
	coerceBool,
	toCamelCase,
} from './stringUtils';

import {
	querySchema
} from './validation';
import { duotoneRef } from './duotone';

const MOCK_RESPONSE_OK = {  // minimal representation of http.IncomingMessage
	statusCode: 200,
	statusMessage: 'OK',
	headers: {
		'x-meetup-request-id': 'mock request'
	},
	request: {
		uri: {},
	},
};

/**
 * In order to receive cookies from `externalRequest` requests, this function
 * provides a cookie jar that is specific to the request.
 *
 * The `requestUrl` is used to determine whether a cookie jar is needed
 *
 * https://github.com/request/request#examples
 *
 * @param {String} requestUrl the URL that will be used in the external request
 * @return {Object} a cookie jar compatible with the npm request `jar` API
 */
export const createCookieJar = requestUrl => {
	const parsedUrl = url.parse(requestUrl);
	if (parsedUrl.pathname === '/sessions') {
		return externalRequest.jar();  // create request/url-specific cookie jar
	}
	return null;
};

const X_HEADERS = [
	'x-total-count'
];

export const parseMetaHeaders = headers => {
	const meetupHeaders = Object.keys(headers)
		.filter(h => h.startsWith('x-meetup-'))
		.reduce((meta, h) => {
			const key = toCamelCase(h.replace('x-meetup-', ''));
			meta[key] = headers[h];
			return meta;
		}, {});

	// special case handling for flags
	if (meetupHeaders.flags) {
		meetupHeaders.flags = querystring.parse(meetupHeaders.flags, {
			delimiter: ',',
			decoder: coerceBool,
		});
	}

	const xHeaders = X_HEADERS.reduce((meta, h) => {
		const key = toCamelCase(h.replace('x-', ''));
		if (h in headers) {
			meta[key] = headers[h];
		}
		return meta;
	}, {});

	return {
		...meetupHeaders,
		...xHeaders,
	};
};

/**
 * Accept an Error and return an object that will be used in place of the
 * expected API return value
 */
function formatApiError(err) {
	return {
		error: err.message
	};
}

export const errorResponse$ = requestUrl => err =>
	Rx.Observable.of({
		value: formatApiError(err),
		meta: {
			endpoint: url.parse(requestUrl).pathname,
		},
	});

export const parseApiValue = ([response, body]) => {
	// treat non-success HTTP code as an error
	if (response.statusCode < 200 || response.statusCode > 299) {
		return formatApiError(new Error(response.statusMessage));
	}
	try {
		if (response.statusCode === 204) {  // NoContent response type
			return null;
		}

		const value = JSON.parse(body);
		if (value && value.problem) {
			return formatApiError(new Error(`API problem: ${value.problem}: ${value.details}`));
		}
		return value;
	} catch(err) {
		return formatApiError(err);
	}
};

/**
 *
 * mostly error handling - any case where the API does not satisfy the
 * "api response" formatting requirement: plain object containing the requested
 * values
 *
 * This utility is specific to the response format of the API being consumed
 * @param {Array} the callback args for npm request - [response, body], where
 * `response` is an `Http.IncomingMessage` and `body` is the body text of the
 * response.
 * @return responseObj the JSON-parsed text, possibly with error info
 */
export const parseApiResponse = requestUrl => ([response, body]) => {
	const meta = {
		...parseMetaHeaders(response.headers),
		endpoint: url.parse(requestUrl).pathname,
	};

	return {
		value: parseApiValue([response, body]),
		meta,
	};

};

/**
 * Transform each query into the arguments needed for a `request` call.
 *
 * Some request options are constant for all queries, and these are curried into
 * a function that can be called with a single query as part of the request
 * stream
 *
 * @see {@link https://www.npmjs.com/package/request}
 *
 * @param {Object} externalRequestOpts request options that will be applied to
 *   every query request
 * @param {Object} query { endpoint, params, flags }
 *   call)
 * @return {Object} externalRequestOptsQuery argument for the call to
 *   `externalRequest` for the query
 */
export const buildRequestArgs = externalRequestOpts =>
	({ endpoint, params, flags }) => {

		// cheap, brute-force object clone, acceptable for serializable object
		const externalRequestOptsQuery = JSON.parse(JSON.stringify(externalRequestOpts));

		externalRequestOptsQuery.url = encodeURI(`/${endpoint}`);
		externalRequestOptsQuery.jar = createCookieJar(externalRequestOptsQuery.url);

		if (flags) {
			externalRequestOptsQuery.headers['X-Meetup-Request-Flags'] = flags.join(',');
		}

		const dataParams = querystring.stringify(params);

		switch (externalRequestOptsQuery.method) {
		case 'get':
		case 'delete':
			externalRequestOptsQuery.url += `?${dataParams}`;
			externalRequestOptsQuery.headers['X-Meta-Photo-Host'] = 'secure';
			break;
		case 'post':
			externalRequestOptsQuery.body = dataParams;
			externalRequestOptsQuery.headers['content-type'] = 'application/x-www-form-urlencoded';
			break;
		}

		// production logs will automatically be JSON-parsed in Stackdriver
		console.log(JSON.stringify({
			type: 'External request headers',
			payload: externalRequestOptsQuery.headers
		}));

		return externalRequestOptsQuery;
	};

/**
 * Format apiResponse to match expected state structure
 *
 * @param {Object} apiResponse JSON-parsed api response data
 */
export const apiResponseToQueryResponse = query => ({ value, meta }) => ({
	[query.ref]: {
		type: query.type,
		value,
		meta
	}
});

export function getAuthHeaders({ state }) {
	// internal server requests may set non-encoded token cookie __internal_oauth_token
	const oauth_token = state.oauth_token || state.__internal_oauth_token;
	if (!state.MEETUP_MEMBER && oauth_token) {
		return {
			authorization: `Bearer ${oauth_token}`,
		};
	}
	const cookies = { ...state };
	const csrf = uuid.v4();
	cookies.MEETUP_CSRF = csrf;
	cookies.MEETUP_CSRF_DEV = csrf;
	const cookie = Object.keys(cookies)
		.map(name => `${name}=${cookies[name]}`).join('; ');

	return {
		cookie,
		'csrf-token': csrf,
	};
}

export function parseRequestHeaders(request) {
	const externalRequestHeaders = {
		...request.headers,
		...getAuthHeaders(request),
	};

	delete externalRequestHeaders['host'];  // let app server set 'host'
	delete externalRequestHeaders['accept-encoding'];  // let app server set 'accept'
	delete externalRequestHeaders['content-length'];  // original request content-length is irrelevant

	// cloudflare headers we don't want to pass on
	delete externalRequestHeaders['cf-ray'];
	delete externalRequestHeaders['cf-ipcountry'];
	delete externalRequestHeaders['cf-visitor'];
	delete externalRequestHeaders['cf-connecting-ip'];

	return externalRequestHeaders;
}

export function parseRequestQueries(request) {
	const {
		method,
		payload,
		query,
	} = request;
	const queriesJSON = method === 'post' ? payload.queries : query.queries;
	const validatedQueries = Joi.validate(
		JSON.parse(queriesJSON),
		Joi.array().items(querySchema)
	);
	if (validatedQueries.error) {
		throw validatedQueries.error;
	}
	return validatedQueries.value;
}

/**
 * Parse request for queries and request options
 * @return {Object} { queries, externalRequestOpts }
 */
export function parseRequest(request, baseUrl) {
	return {
		externalRequestOpts: {
			baseUrl,
			method: request.method,
			headers: parseRequestHeaders(request),  // make a copy to be immutable
			mode: 'no-cors',
			time: true,  // time the request for logging
			agentOptions: {
				rejectUnauthorized: baseUrl.indexOf('.dev') === -1
			},
		},
		queries: parseRequestQueries(request),
	};
}

/**
 * From a provided set of signed duotone URLs, create a function that injects
 * the full duotone URL into a group object with the key `duotoneUrl`.
 *
 * @param {Object} duotoneUrls map of `[duotoneRef]: url template root`
 * @param {Object} group group object from API
 * @return {Object} the mutated group object
 */
export const groupDuotoneSetter = duotoneUrls => group => {
	const photo = group.key_photo || group.group_photo || {};
	const duotoneKey = group.photo_gradient && duotoneRef(
			group.photo_gradient.light_color,
			group.photo_gradient.dark_color
		);
	const duotoneUrlRoot = duotoneKey && duotoneUrls[duotoneKey];
	if (duotoneUrlRoot && photo.id) {
		group.duotoneUrl = `${duotoneUrlRoot}/${photo.id}.jpeg`;
	}
	return group;
};

/**
 * From a provided set of signed duotoneUrls, create a function that injects
 * the full duotone URL into an query response containing objects that support
 * duotoned images (anything containing group or event objects
 *
 * @param {Object} duotoneUrls map of `[duotoneRef]: url template root`
 * @param {Object} queryResponse { type: <type>, value: <API object> }
 * @return {Object} the modified queryResponse
 */
export const apiResponseDuotoneSetter = duotoneUrls => {
	const setGroupDuotone = groupDuotoneSetter(duotoneUrls);
	return queryResponse => {
		// inject duotone URLs into any group query response
		Object.keys(queryResponse)
			.forEach(key => {
				const { type, value } = queryResponse[key];
				if (!value || value.error) {
					return;
				}
				let groups;
				switch (type) {
				case 'group':
					groups = value instanceof Array ? value : [value];
					groups.forEach(setGroupDuotone);
					break;
				case 'home':
					(value.rows || []).map(({ items }) => items)
						.forEach(items => items.filter(({ type }) => type === 'group')
							.forEach(({ group }) => setGroupDuotone(group))
						);
					break;
				}
			});
		return queryResponse;
	};
};

/**
 * Fake an API request and directly return the stringified mockResponse
 */
export const makeMockRequest = mockResponse => requestOpts =>
	Rx.Observable.of([MOCK_RESPONSE_OK, JSON.stringify(mockResponse)])
		.do(() => console.log(`MOCKING response to ${requestOpts.url}`));

const externalRequest$ = Rx.Observable.bindNodeCallback(externalRequest);
/**
 * Make a real external API request, return response body string
 */
export const makeExternalApiRequest = (request, API_TIMEOUT) => requestOpts => {
	return externalRequest$(requestOpts)
		.do(  // log errors
			null,
			err => {
				console.error(JSON.stringify({
					err: err.stack,
					message: 'REST API request error',
					request: {
						id: request.id
					},
					context: requestOpts,
				}));
			}
		)
		.timeout(API_TIMEOUT)
		.map(([response, body]) => [response, body, requestOpts.jar]);
};

export const logApiResponse = ([response, body]) => {
	const {
		uri: {
			query,
			pathname,
		},
		method,
	} = response.request;

	const responseLog = {
		request: {
			query: (query || '').split('&').reduce((acc, keyval) => {
				const [key, val] = keyval.split('=');
				acc[key] = val;
				return acc;
			}, {}),
			pathname,
			method,
		},
		response: {
			elapsedTime: response.elapsedTime,
			status: response.statusCode,
			body: body.length > 256 ? `${body.substr(0, 256)}...`: body,
		},
	};

	// production logs will automatically be JSON-parsed in Stackdriver
	console.log(JSON.stringify({
		type: 'REST API response JSON',
		payload: responseLog
	}));
};

/**
 * Login responses contain oauth info that should be applied to the response.
 * If `request.plugins.requestAuth.reply` exists (supplied by the requestAuthPlugin),
 * the application is able to set cookies on the response. Otherwise, return
 * the login response unchanged
 */
export const parseLoginAuth = (request, query) => response => {
	if (query.type === 'login' && request.plugins.requestAuth && !response.value.error) {
		// kill the logged-out auth
		removeAuthState(['oauth_token', 'refresh_token'], request, request.plugins.requestAuth.reply);
		// only return the member, no oauth data
		return {
			...response,
			value: { member: response.value.member }
		};
	}
	return response;
};

/**
 * When a tough-cookie cookie jar is provided, forward the cookies along with
 * the overall /api response back to the client
 */
export const injectResponseCookies = request => ([response, _, jar]) => {
	if (!jar) {
		return;
	}
	const requestUrl = response.toJSON().request.uri.href;
	jar.getCookies(requestUrl).forEach(cookie => {
		const cookieOptions = {
			domain: cookie.domain,
			path: cookie.path,
			isHttpOnly: cookie.httpOnly,
			isSameSite: false,
			isSecure: process.env.NODE_ENV === 'production',
			strictHeader: false,  // Can't enforce RFC 6265 cookie validation on external services
		};

		request.plugins.requestAuth.reply.state(
			cookie.key,
			cookie.value,
			cookieOptions
		);
	});
};

/**
 * Make an API request and parse the response into the expected `response`
 * object shape
 */
export const makeApiRequest$ = (request, API_TIMEOUT, duotoneUrls) => {
	const setApiResponseDuotones = apiResponseDuotoneSetter(duotoneUrls);
	return ([requestOpts, query]) => {
		const request$ = query.mockResponse ?
			makeMockRequest(query.mockResponse) :
			makeExternalApiRequest(request, API_TIMEOUT);

		return Rx.Observable.defer(() => {
			request.log(['api', 'info'], `REST API request: ${requestOpts.url}`);
			return request$(requestOpts)
				.do(logApiResponse)             // this will leak private info in API response
				.do(injectResponseCookies(request))
				.map(parseApiResponse(requestOpts.url))  // parse into plain object
				.catch(errorResponse$(requestOpts.url))
				.map(parseLoginAuth(request, query))     // login has oauth secrets - special case
				.map(apiResponseToQueryResponse(query))  // convert apiResponse to app-ready queryResponse
				.map(setApiResponseDuotones);            // special duotone prop
		});
	};
};

