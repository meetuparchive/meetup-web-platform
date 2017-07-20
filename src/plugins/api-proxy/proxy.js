// @flow
// Implicit dependency: tracking plugin providing request.trackApi method
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';

import { API_PROXY_PLUGIN_NAME } from './';
import { apiResponseDuotoneSetter } from './util/duotone';
import { makeSend$ } from './util/send';
import { makeReceive } from './util/receive';

/*
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
export default (request: HapiRequest) => {
	const setApiResponseDuotones = apiResponseDuotoneSetter(
		request.server.plugins[API_PROXY_PLUGIN_NAME].duotoneUrls
	);
	return (queries: Array<Query>): Observable<Array<QueryResponse>> => {
		// send$ and receive$ can only be initialized once queries have been parsed
		// because request.state has not been initialized when the outer function
		// is called by server.decorate
		const send$ = makeSend$(request);
		const receive = makeReceive(request);

		const apiRequests$ = queries.map(query =>
			send$(query).map(receive(query)).map(setApiResponseDuotones)
		);
		// 4. zip them together to make requests in parallel and return responses in order
		// $FlowFixMe - .zip is not currently defined in Observable static properties
		return Observable.zip(...apiRequests$).do(request.trackApi);
	};
};
