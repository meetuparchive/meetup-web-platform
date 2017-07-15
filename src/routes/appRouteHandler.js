export const getAppRouteHandler = renderRequestMap => (request, reply) => {
	const redirect = request.getLanguageRedirect();
	if (redirect) {
		return reply.redirect(redirect);
	}
	const requestLanguage = request.getLanguage();
	const renderRequest = renderRequestMap[requestLanguage];

	return renderRequest(request)
		.do(() => request.server.app.logger.debug('HTML response ready'))
		.subscribe(
			({ redirect, result, statusCode }) => {
				// response is sent when this function returns (`nextTick`)
				if (redirect) {
					return reply.redirect(redirect.url).permanent(redirect.permanent);
				}
				request.trackSession();
				return reply(result).code(statusCode);
			},
			err => reply(err) // 500 error - will only be thrown on bad implementation
		);
};
