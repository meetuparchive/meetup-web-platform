import 'rxjs/add/operator/catch';

const handleQueryResponses = (request, reply) => queryResponses =>
	reply(
		JSON.stringify({
			responses: queryResponses,
		})
	).type('application/json');

export const getApiProxyRouteHandler = proxyApiRequest$ => (request, reply) => {
	proxyApiRequest$(request).subscribe(
		handleQueryResponses(request, reply),
		err => reply(err) // 500 error - will only be thrown on bad implementation
	);
};
