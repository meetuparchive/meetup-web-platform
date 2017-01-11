import chalk from 'chalk';
import {
	getLanguage,
	checkLanguageRedirect,
} from '../util/languageUtils';

export const getAppRouteHandler = renderRequestMap => (request, reply) => {
	const supportedLangs = Object.keys(renderRequestMap);
	const requestLanguage = getLanguage(request, supportedLangs);
	const redirect = checkLanguageRedirect(request, reply, requestLanguage, supportedLangs);
	if (redirect) {
		return redirect;
	}
	request.log(['info'], chalk.green(`Request received for ${request.url.href} (${requestLanguage})`));

	return renderRequestMap[requestLanguage](request)
		.do(() => request.log(['info'], chalk.green('HTML response ready')))
		.subscribe(({ result, statusCode }) => {
			// response is sent when this function returns (`nextTick`)
			const response = reply(result)
				.code(statusCode);

			reply.track(response, 'session');
		});
};

