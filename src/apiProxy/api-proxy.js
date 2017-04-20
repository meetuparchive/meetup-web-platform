import { Observable } from 'rxjs/Observable';
import { zip } from 'rxjs/add/observable/zip';

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
 * @param {Array} queries (optional) queries to make requests for - used when
 *   the queries are not part of the original request, e.g. for initial render
 *   requests.
 * @return Array$ contains all API responses corresponding to the provided queries
 */
const apiProxy$ = (request, queries) => {
	// 1. get the queries and the 'universal' `externalRequestOpts` from the request
	const parsedRequest = parseRequest(request);
	queries = queries || parsedRequest.queries;

	// 2. curry a function that uses `externalRequestOpts` as a base from which
	// to build the query-specific API request options object
	const queryToRequestOpts = buildRequestArgs(parsedRequest.externalRequestOpts);

	// 3. map the queries onto an array of api request observables
	const apiRequests$ = queries
		.map(queryToRequestOpts)
		.map((opts, i) => ([opts, queries[i]]))  // zip the query back into the opts
		.map(makeApiRequest$(request));

	// 4. zip them together to send them parallel and return responses in order
	return Observable.zip(...apiRequests$);
};

export default apiProxy$;

