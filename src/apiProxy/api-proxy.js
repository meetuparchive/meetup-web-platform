import querystring from 'querystring';
import externalRequest from 'request';
import Rx from 'rxjs';
const externalRequest$ = Rx.Observable.bindNodeCallback(externalRequest);

import * as apiConfigCreators from './apiConfigCreators';
import { duotoneRef } from '../util/duotone';

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
 * mostly error handling - any case where the API does not satisfy the
 * "api response" formatting requirement: plain object containing the requested
 * values
 *
 * This utility is specific to the response format of the API being consumed
 * @param response {String} the raw response body text from an API call
 * @return responseObj the JSON-parsed text, possibly with error info
 */
export const parseApiResponse = response => {
	let responseObj;
	let error;

	try {
		responseObj = JSON.parse(response);
	} catch(e) {
		error = `API response was not JSON: "${response}"`;
	}
	if (responseObj && responseObj.problem) {
		error = `API problem: ${responseObj.problem}: ${responseObj.details}`;
	}

	return error ? { error } : responseObj;
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
export function queryToApiConfig({ type, params }) {
	const configCreator = apiConfigCreators[type];
	if (!configCreator) {
		throw new ReferenceError(`No API specified for query type ${type}`);
	}
	return configCreator(params);
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
 * @param {Object} apiConfig { endpoint, params }
 *   call)
 * @return {Object} externalRequestOptsQuery argument for the call to
 *   `externalRequest` for the query
 */
export const buildRequestArgs = externalRequestOpts => ({ endpoint, params }) => {
	const externalRequestOptsQuery = { ...externalRequestOpts };
	externalRequestOptsQuery.url = encodeURI(`/${endpoint}`);

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
export const apiResponseToQueryResponse = query => response => ({
	[query.ref]: {
		type: query.type,
		value: response,
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
const makeMockRequest = mockResponse => requestOpts =>
	Rx.Observable.of(JSON.stringify(mockResponse))
		.do(() => console.log(`MOCKING response to ${requestOpts.url}`));

const logResponseTime = log => ([response, body]) =>
	log(['api', 'info'], `REST API response: ${response.elapsedTime}ms - ${response.request.uri.path}`);

/**
 * Make a real external API request, return response body string
 */
const makeExternalApiRequest = (request, API_TIMEOUT) => requestOpts =>
	externalRequest$(requestOpts)
		.timeout(API_TIMEOUT, new Error('API response timeout'))
		.do(logResponseTime(request.log.bind(request)))
		.map(([response, body]) => body);    // ignore Response object, just process body string

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

		request.log(['api', 'info'], `REST API request: ${requestOpts.url}`);
		return request$(requestOpts)
			.map(parseApiResponse)             // parse into plain object
			.catch(error => Rx.Observable.of({ error: error.message }))
			.map(apiResponseToQueryResponse(query))    // convert apiResponse to app-ready queryResponse
			.map(setApiResponseDuotones);        // special duotone prop
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
const apiProxy$ = ({ API_TIMEOUT=5000, baseUrl='', duotoneUrls={} }) => {

	return request => {
		if (!request.state.oauth_token) {
			throw new Error('Request does not contain oauth cookie, cannot call API');
		}

		// 1. get the queries and the 'universal' `externalRequestOpts` from the request
		const { queries, externalRequestOpts } = parseRequest(request, baseUrl);

		// 2. curry a function that uses `externalRequestOpts` as a base from which
		// to build the query-specific API request options object
		const apiConfigToRequestOptions = buildRequestArgs(externalRequestOpts);

		// 3. map the queries onto an array of api request observables
		const apiRequests$ = queries
			.map(queryToApiConfig)
			.map(apiConfigToRequestOptions)
			.map((opts, i) => ([opts, queries[i]]))  // zip the query back into the opts
			.map(makeApiRequest$(request, API_TIMEOUT, duotoneUrls));

		// 4. zip them together to send them parallel and receive them in order
		return Rx.Observable.zip(...apiRequests$);
	};
};

export default apiProxy$;

