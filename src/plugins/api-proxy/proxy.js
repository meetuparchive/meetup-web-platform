// @flow
// Implicit dependency: tracking plugin providing request.trackApi method
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';

import {
	buildRequestArgs,
	makeApiRequest$,
	getExternalRequestOpts,
} from './util';

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
 * requests, so these are initialized in `getExternalRequestOpts`. `buildRequestArgs`
 * then curries those into a function that can accept a `query` to write the
 * query-specific options.
 */
export default (request: HapiRequest) => (
	queries: Array<Query>
): Observable<Array<QueryResponse>> => {
	// 1. get the queries and the 'universal' `externalRequestOpts` from the request
	const externalRequestOpts = getExternalRequestOpts(request);

	// 2. curry a function that uses `externalRequestOpts` as a base from which
	// to build the query-specific API request options object
	const queryToRequestOpts = buildRequestArgs(externalRequestOpts);

	// 3. map the queries onto an array of api request observables
	const apiRequests$ = queries
		.map(queryToRequestOpts)
		.map((opts, i) => [opts, queries[i]]) // zip the query back into the opts
		.map(makeApiRequest$(request));

	// 4. zip them together to make requests in parallel and return responses in order
	// $FlowFixMe - .zip is not currently defined in Observable static properties
	return Observable.zip(...apiRequests$).do(request.trackApi);
};
