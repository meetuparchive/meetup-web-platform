import Accepts from 'accepts';
import chalk from 'chalk';

/**
 * Only one wildcard route for all application GET requests - exceptions are
 * described in the routes above
 */
const getApplicationRoute = renderRequestMap => ({
	method: 'GET',
	path: '/{wild*}',
	handler: (request, reply) => {
		const requestLanguage = Accepts(request).language(Object.keys(renderRequestMap));
		request.log(['info'], chalk.green(`Request received for ${request.url.href} (${requestLanguage})`));

		return renderRequestMap[requestLanguage](request)
			.do(() => request.log(['info'], chalk.green('HTML response ready')))
			.subscribe(({ result, statusCode }) => {
				// response is sent when this function returns (`nextTick`)
				const response = reply(result)
					.code(statusCode);

				reply.track(response, 'session');
			});
	},
});

export default getApplicationRoute;

