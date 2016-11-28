import url from 'url';
import querystring from 'querystring';
import externalRequest from 'request';
import Rx from 'rxjs';
const externalRequest$ = Rx.Observable.bindNodeCallback(externalRequest);

import * as apiConfigCreators from './apiConfigCreators';
import { duotoneRef } from '../util/duotone';
import {
	applyAuthState,
} from '../util/authUtils';

const parseResponseFlags = flagHeader =>
	(flagHeader || '')
		.split(',')
		.filter(pair => pair)  // ignore empty elements in the array
		.map(pair => pair.split('='))
		.reduce((flags, [key, val]) => {
			flags[key] = val === 'true';
			return flags;
		}, {});

const parseMetaHeaders = headers => {
	const flags = parseResponseFlags(headers['x-meetup-flags']);
	const requestId = headers['x-meetup-request-id'];
	return {
		flags,
		requestId,
	};
};

/**
 * Given the current request and API server host, proxy the request to the API
 * and return the responses corresponding to the provided queries.
 *
 * This module plugs in to any system that provides a `request` object with:
 * - headers
 * - method ('get'/'post')
 * - query string parameters parsed as a plain object (for GET requests)
 * - payload/body (for POST requests)
 *
 * @module ApiProxy
 */

/**
 * Accept an Error and return an object that will be used in place of the
 * expected API return value
 */
function formatApiError(err) {
	return {
		error: err.message
	};
}

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
	let value;
	const meta = {
		...parseMetaHeaders(response.headers),
		endpoint: url.parse(requestUrl).pathname,
	};

	// treat non-success HTTP code as an error
	if (response.statusCode < 200 || response.statusCode > 299) {
		return {
			value: formatApiError(new Error(response.statusMessage)),
			meta,
		};
	}
	try {
		value = JSON.parse(body);
		if (value && value.problem) {
			value = formatApiError(new Error(`API problem: ${value.problem}: ${value.details}`));
		}
		return {
			value,
			meta,
		};
	} catch(err) {
		return {
			value: formatApiError(err),
			meta,
		};
	}
};

/**
 * Translate a query into an API `endpoint` + `params`. The translation is based
 * on the Meetup REST API.
 *
 * This function serves as an adapter between the structure of a query and the
 * API-specific config needed to get that data. Note that *each* required
 * endpoint needs to be manually configured
 *
 * {@link http://www.meetup.com/meetup_api/docs/batch/}
 *
 * @param {Object} query a query object from the application
 * @return {Object} the arguments for api request, including endpoint
 */
export function queryToApiConfig({ type, params, flags }) {
	const configCreator = apiConfigCreators[type];
	if (!configCreator) {
		throw new ReferenceError(`No API specified for query type ${type}`);
	}
	return {
		...configCreator(params),  // endpoint, params
		flags,
	};
}

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
 * @param {Object} apiConfig { endpoint, params, flags }
 *   call)
 * @return {Object} externalRequestOptsQuery argument for the call to
 *   `externalRequest` for the query
 */
export const buildRequestArgs = externalRequestOpts =>
	({ endpoint, params, flags }) => {

		// cheap, brute-force object clone, acceptable for serializable object
		const externalRequestOptsQuery = JSON.parse(JSON.stringify(externalRequestOpts));
		externalRequestOptsQuery.url = encodeURI(`/${endpoint}`);

		if (flags) {
			externalRequestOptsQuery.headers['X-Meetup-Request-Flags'] = flags.join(',');
		}

		const dataParams = querystring.stringify(params);

		switch (externalRequestOptsQuery.method) {
		case 'get':
			externalRequestOptsQuery.url += `?${dataParams}`;
			externalRequestOptsQuery.headers['X-Meta-Photo-Host'] = 'secure';
			break;
		case 'post':
			externalRequestOptsQuery.body = dataParams;
			externalRequestOptsQuery.headers['content-type'] = 'application/x-www-form-urlencoded';
			break;
		}

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

/**
 * Parse request for queries and request options
 * @return {Object} { queries, externalRequestOpts }
 */
export function parseRequest(request, baseUrl) {
	const {
		headers,
		method,
		query,
		payload,
		state,
	} = request;

	// Forward the Hapi request headers from the client query
	// except for `host` and `accept-encoding`
	// which should be provided by the external api request
	const externalRequestHeaders = {
		...headers,
		authorization: `Bearer ${state.oauth_token}`,
	};

	delete externalRequestHeaders['host'];
	delete externalRequestHeaders['accept-encoding'];
	delete externalRequestHeaders['content-length'];  // original request content-length is irrelevant

	const externalRequestOpts = {
		baseUrl,
		method,
		headers: externalRequestHeaders,  // make a copy to be immutable
		mode: 'no-cors',
		time: true,
		agentOptions: {
			rejectUnauthorized: baseUrl.indexOf('.dev') === -1
		}
	};


	const queriesJSON = request.method === 'get' ? query.queries : payload.queries;
	const queries = JSON.parse(queriesJSON);
	return { queries, externalRequestOpts };
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
 * Login responses contain oauth info that should be applied to the response.
 * If `request.plugins.requestAuth.reply` exists (supplied by the requestAuthPlugin),
 * the application is able to set cookies on the response. Otherwise, return
 * the login response unchanged
 */
export const parseLoginAuth = (request, query) => response => {
	if (query.type === 'login' && request.plugins.requestAuth) {
		const {
			oauth_token,
			refresh_token,
			expires_in,
			member,
		} = response.value;
		applyAuthState(request, request.plugins.requestAuth.reply)({
			oauth_token,
			refresh_token,
			expires_in
		});
		response.value = { member };
	}
	return response;
};

const MOCK_RESPONSE_OK = {  // minimal representation of http.IncomingMessage
	statusCode: 200,
	statusMessage: 'OK',
	headers: {
		'x-meetup-request-id': 'mock request'
	},
};
/**
 * Fake an API request and directly return the stringified mockResponse
 */
const makeMockRequest = mockResponse => requestOpts =>
	Rx.Observable.of([MOCK_RESPONSE_OK, JSON.stringify(mockResponse)])
		.do(() => console.log(`MOCKING response to ${requestOpts.url}`));

export const logApiResponse = appRequest => ([response, body]) => {
	const {
		uri: {
			query,
			pathname,
		},
		method,
	} = response.request;

	const responseLog = {
		request: {
			query: query.split('&').reduce((acc, keyval) => {
				const [key, val] = keyval.split('=');
				acc[key] = val;
				return acc;
			}, {}),
			pathname,
			method,
		},
		response: {
			elapsedTime: response.elapsedTime,
			body: body.length > 256 ? `${body.substr(0, 256)}...`: body,
		},
	};
	appRequest.log(['api', 'info'], JSON.stringify(responseLog, null, 2));
};

/**
 * Make a real external API request, return response body string
 */
const makeExternalApiRequest = (request, API_TIMEOUT) => requestOpts =>
	externalRequest$(requestOpts)
		.timeout(API_TIMEOUT, new Error('API response timeout'))
		.do(logApiResponse(request));

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
				.map(parseApiResponse(requestOpts.url))  // parse into plain object
				.map(parseLoginAuth(request, query))     // login has oauth secrets - special case
				.map(apiResponseToQueryResponse(query))  // convert apiResponse to app-ready queryResponse
				.map(setApiResponseDuotones);            // special duotone prop
		});
	};
};

/**
 * This function transforms a single request to the application server into a
 * parallel array of requests to the API server, and then re-assembles the
 * API responses into an array of 'query responses' - i.e. API responses that
 * are formatted with properties from their corresponding query (ref, type).
 *
 * Most of the `options` for the `externalRequest` are shared for all the API
 * requests, so these are initialized in `parseRequest`. `buildRequestArgs`
 * then curries those into a function that can accept a `query` to write the
 * query-specific options.
 *
 * @param {Request} request Hapi request object
 * @param {Object} baseUrl API server base URL for all API requests
 * @return Array$ contains all API responses corresponding to the provided queries
 */
const apiProxy$ = ({ API_TIMEOUT=8000, baseUrl='', duotoneUrls={} }) => {

	return request => {
		request.log(['api', 'info'], 'Parsing api endpoint request');
		// 1. get the queries and the 'universal' `externalRequestOpts` from the request
		const { queries, externalRequestOpts } = parseRequest(request, baseUrl);

		// 2. curry a function that uses `externalRequestOpts` as a base from which
		// to build the query-specific API request options object
		const apiConfigToRequestOptions = buildRequestArgs(externalRequestOpts);

		request.log(['api', 'info'], JSON.stringify(queries));
		// 3. map the queries onto an array of api request observables
		const apiRequests$ = queries
			.map(queryToApiConfig)
			.map(apiConfigToRequestOptions)
			.map((opts, i) => ([opts, queries[i]]))  // zip the query back into the opts
			.map(makeApiRequest$(request, API_TIMEOUT, duotoneUrls));

		// 4. zip them together to send them parallel and return responses in order
		return Rx.Observable.zip(...apiRequests$);
	};
};

export default apiProxy$;

