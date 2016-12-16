import Accepts from 'accepts';
import chalk from 'chalk';

const getLanguage = (request, supportedLangs, defaultLang='en-US') => {
	return Accepts(request).language(supportedLangs) || defaultLang;
};

export const getAppRouteHandler = renderRequestMap => (request, reply) => {
	const requestLanguage = getLanguage(request, Object.keys(renderRequestMap), 'en-US');
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
