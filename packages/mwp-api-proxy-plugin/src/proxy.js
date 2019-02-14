// @flow
import newrelic from 'newrelic';
// Implicit dependency: tracking plugin providing request.trackActivity method

import { apiResponseDuotoneSetter } from './util/duotone';
import { makeSendQuery } from './util/send';
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
	return (queries: Array<Query>): Promise<Array<QueryResponse>> => {
		const [query] = queries;
		// special case handling of tracking call - must supply a response, but
		// empty object is fine
		if (queries.length === 1 && query.endpoint === 'track') {
			request.trackActivity(query.params);
			return Promise.resolve([{ ref: query.ref, value: {} }]);
		}

		// send$ and receive must be assigned here rather than when the `request`
		// is first passed in because the `request.state` isn't guaranteed to be
		// available until after the `queries` have been parsed
		const sendQuery = makeSendQuery(request);
		const receive = makeReceive(request);

		// create an array of in-flight API request Promises
		const apiRequests = queries.map(query =>
			sendQuery(query)
				.then(newrelic.createTracer('meetupApiRequest', receive(query)))
				.then(setApiResponseDuotones)
		);

		// wait for all requests to response and aggregate into array.
		// caller should catch any errors
		return Promise.all(apiRequests).then(responses => {
			request.trackActivity();
			return responses;
		});
	};
};
