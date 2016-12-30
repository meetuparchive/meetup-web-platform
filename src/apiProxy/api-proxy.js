import Rx from 'rxjs';

import {
	buildRequestArgs,
	makeApiRequest$,
	parseRequest,
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
		const queryToRequestOpts = buildRequestArgs(externalRequestOpts);

		request.log(['api', 'info'], JSON.stringify(queries));
		// 3. map the queries onto an array of api request observables
		const apiRequests$ = queries
			.map(queryToRequestOpts)
			.map((opts, i) => ([opts, queries[i]]))  // zip the query back into the opts
			.map(makeApiRequest$(request, API_TIMEOUT, duotoneUrls));

		// 4. zip them together to send them parallel and return responses in order
		return Rx.Observable.zip(...apiRequests$);
	};
};

export default apiProxy$;

