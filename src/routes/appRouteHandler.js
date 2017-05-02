import { getLanguage, checkLanguageRedirect } from '../util/languageUtils';

export const getAppRouteHandler = renderRequestMap => (request, reply) => {
	const supportedLangs = Object.keys(renderRequestMap);
	const requestLanguage = getLanguage(request, supportedLangs);
	const redirect = checkLanguageRedirect(
		request,
		reply,
		requestLanguage,
		supportedLangs
	);
	if (redirect) {
		return redirect;
	}

	return renderRequestMap
		[requestLanguage](request)
		.do(() => request.server.app.logger.debug('HTML response ready'))
		.subscribe(({ result, statusCode }) => {
			// response is sent when this function returns (`nextTick`)
			const response = reply(result).code(statusCode);

			reply.track(response, 'session');
		});
};
