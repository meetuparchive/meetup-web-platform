// @flow
import newrelic from 'newrelic';
// Implicit dependency: tracking plugin providing request.trackActivity method

import { apiResponseDuotoneSetter } from './util/duotone';
import { makeSendQuery } from './util/send';
import { makeReceiver } from './util/receive';

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
const apiProxy = (request: HapiRequest) => {
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

		// sendQuery and receiver must be assigned here rather than when the `request`
		// is first passed in because the `request.state` isn't guaranteed to be
		// available until after the `queries` have been parsed
		const sendQuery = makeSendQuery(request);
		const receiver = makeReceiver(request);

		// create an array of in-flight API request Promises
		const apiRequests = queries.map(query => {
			const receive = receiver(query);
			// start the meetupApiRequest trace, which will return when the `receive(query)`
			// returned function completes
			const tracedResponseReceiver = newrelic.createTracer(
				'meetupApiRequest',
				receive
			);
			// now send the query and return the Promise of resolved responses
			return sendQuery(query)
				.then(tracedResponseReceiver)
				.then(setApiResponseDuotones);
		});

		// wait for all requests to respond
		// caller should catch any errors
		return Promise.all(apiRequests).then(responses => {
			// tracking side effect only
			request.trackActivity();
			return responses;
		});
	};
};
export default apiProxy;
