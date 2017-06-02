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
	request.app.localeCode = requestLanguage;
	request.app.supportedLocaleCodes = supportedLangs;
	const renderRequest = renderRequestMap[requestLanguage];

	return renderRequest(request)
		.do(() => request.server.app.logger.debug('HTML response ready'))
		.subscribe(({ redirect, result, statusCode }) => {
			// response is sent when this function returns (`nextTick`)
			if (redirect) {
				return reply.redirect(redirect);
			}
			const response = reply(result).code(statusCode);

			reply.trackSession(response);
		});
};
