// @flow
// Implicit dependency: tracking plugin providing request.trackActivity method

import { makeSendQuery } from './util/send';
import { makeReceiver, makeApiResponseToQueryResponse } from './util/receive';

// ALLOWED EXTERNAL DOMAINS
const domains = ['meetuphq.io', 'meetup.com'];
const getEndPoint = query => {
	if (!query.endpoint) return '';
	if (typeof query.endpoint === 'string') return query.endpoint;
	return '';
};

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
	return (
		queries: Array<Query>,
		activityInfo: ActivityInfo
	): Promise<Array<QueryResponse>> => {
		const [query] = queries;

		if (queries.length === 1 && query.endpoint === 'track') {
			// special case handling of tracking call - must supply a response, but
			// empty object is fine

			if (query.params !== undefined) {
				const { viewName, subViewName } = query.params;
				activityInfo.viewName = viewName;
				activityInfo.subViewName = subViewName;
			}

			request.trackActivity(activityInfo);
			return Promise.resolve([{ ref: query.ref, value: {} }]);
		}

		request.trackActivity(activityInfo);

		// sendQuery must be assigned here rather than when the `request`
		// is first passed in because the `request.state` isn't guaranteed to be
		// available until after the `queries` have been parsed
		const sendQuery = makeSendQuery(request);
		const receiver = makeReceiver(request);

		// create an array of in-flight API request Promises
		const apiRequests = queries.map(query => {
			const endPoint = getEndPoint(query);
			if (endPoint && endPoint.includes('://')) {
				try {
					const url = new URL(endPoint);
					if (!domains.some(domain => url.host.endsWith(domain))) {
						// return null instead of querying external api
						return Promise.resolve(
							makeApiResponseToQueryResponse(query)({
								value: null,
								error: 'Access denied',
								meta: {
									endpoint: endPoint,
									statusCode: 403,
								},
							})
						);
					}
				} catch (err) {
					// do nothing
				}
			}

			const receive = receiver(query);

			// now send the query and return the Promise of resolved responses
			return sendQuery(query).then(receive);
		});

		// wait for all requests to respond
		// caller should catch any errors
		return Promise.all(apiRequests);
	};
};
export default apiProxy;
