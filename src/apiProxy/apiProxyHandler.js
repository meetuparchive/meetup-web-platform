import url from 'url';
import Boom from 'boom';
import rison from 'rison';

import 'rxjs/add/operator/catch';

const handleQueryResponses = (request, reply) => queryResponses => {
	const response = reply(
		JSON.stringify({
			responses: queryResponses,
		})
	).type('application/json');

	const payload = request.method === 'post' ? request.payload : request.query;

	const metadataRison = payload.metadata || rison.encode_object({});
	const metadata = rison.decode_object(metadataRison);
	const originUrl = response.request.info.referrer;
	metadata.url = url.parse(originUrl).pathname;
	metadata.method = response.request.method;

	reply.activity(response, 'api', queryResponses, metadata);
};

export const getApiProxyRouteHandler = proxyApiRequest$ => (request, reply) => {
	proxyApiRequest$(request).subscribe(
		handleQueryResponses(request, reply),
		err => {
			reply(Boom.badImplementation(err.message));
		}
	);
};
