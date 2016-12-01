import Rx from 'rxjs';

import {
	applyAuthState,
} from '../util/authUtils';

import {
	apiResponseDuotoneSetter,
	apiResponseToQueryResponse,
	buildRequestArgs,
	makeMockRequest,
	makeExternalApiRequest,
	logApiResponse,
	parseApiResponse,
	parseRequest,
	queryToApiConfig,
} from '../util/apiUtils';


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
				.do(logApiResponse(request))             // this will leak private info in API response
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

