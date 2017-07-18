/*
 * The default API proxy handler - just calls the decorated `proxyApi$` method
 * and serializes the API responses
 */
export default (request, reply) => {
	request.proxyApi$().subscribe(
		responses => reply(JSON.stringify({ responses })).type('application/json'),
		err => reply(err) // 500 error - will only be thrown on bad implementation
	);
};
