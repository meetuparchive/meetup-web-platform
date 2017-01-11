import url from 'url';
import Boom from 'boom';

const handleQueryResponses = (request, reply) => queryResponses => {
	const response = reply(JSON.stringify({
		responses: queryResponses,
	})).type('application/json');

	const payload = request.method === 'post' ?
		request.payload :
		request.query;

	const metadata = JSON.parse(payload.metadata || '{}');
	const originUrl = response.request.info.referrer;
	metadata.url = url.parse(originUrl).pathname;
	metadata.method = response.request.method;

	reply.track(
		response,
		'api',
		queryResponses,
		metadata
	);
};

export const getApiProxyRouteHandler = proxyApiRequest$ => (request, reply) => {
	proxyApiRequest$(request)
		.subscribe(
			handleQueryResponses(request, reply),
			(err) => { reply(Boom.badImplementation(err.message)); }
		);
};

