import Boom from 'boom';

import 'rxjs/add/operator/catch';

const handleQueryResponses = (request, reply) => queryResponses => {
	const response = reply(
		JSON.stringify({
			responses: queryResponses,
		})
	).type('application/json');

	request.trackApi(response, queryResponses);
};

export const getApiProxyRouteHandler = proxyApiRequest$ => (request, reply) => {
	proxyApiRequest$(request).subscribe(
		handleQueryResponses(request, reply),
		err => {
			reply(Boom.badImplementation(err.message));
		}
	);
};
