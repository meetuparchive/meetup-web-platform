// @flow
import newrelic from 'newrelic';
// Implicit dependency: tracking plugin providing request.trackActivity method
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/do';

import { apiResponseDuotoneSetter } from './util/duotone';
import { makeSend$ } from './util/send';
import { makeReceive } from './util/receive';

import { API_PROXY_PLUGIN_NAME } from './config';

/*
 * This function transforms a single request to the application server into a
 * parallel array of requests to the API server, and then re-assembles the
 * API responses into an array of 'query responses' - i.e. API responses that
 * are formatted with properties from their corresponding query (ref, type).
 *
 * The logic for sending the requests is in './util/send' and the logic for
 * receiving the responses is in './util/receive'
 */
export default (request: HapiRequest) => {
	const setApiResponseDuotones = apiResponseDuotoneSetter(
		request.server.plugins[API_PROXY_PLUGIN_NAME].duotoneUrls
	);
	return (queries: Array<Query>): Observable<Array<QueryResponse>> => {
		// send$ and receive must be assigned here rather than when the `request`
		// is first passed in because the `request.state` isn't guaranteed to be
		// available until after the `queries` have been parsed
		const send$ = makeSend$(request);
		const receive = makeReceive(request);

		// create an array of in-flight API request Observables
		const apiRequests$ = queries.map(query =>
			send$(query)
				.map(newrelic.createTracer('meetupApiRequest', receive(query)))
				.map(setApiResponseDuotones)
		);

		// Zip them together to make requests in parallel and return responses in order.
		// This call uses `.first()` to guarantee a single response because WP-596
		// indicated there were sporadic duplicate activity tracking logs, possibly
		// related to request errors
		return Observable.zip(...apiRequests$).first().do(request.trackActivity);
	};
};
