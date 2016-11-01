import Accepts from 'accepts';
import Boom from 'boom';
import chalk from 'chalk';

import apiProxy$ from './apiProxy/api-proxy';
import { trackSession, trackLogin } from './util/tracking';

import {
	duotones,
	getDuotoneUrls
} from './util/duotone';

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

export default function getRoutes(
	renderRequestMap,
	{
		API_TIMEOUT,
		API_SERVER_ROOT_URL,
		PHOTO_SCALER_SALT,
	},
	apiProxyFn$ = apiProxy$) {

	console.log(chalk.green(`Supported languages:\n${Object.keys(renderRequestMap).join('\n')}`));
	const proxyApiRequest$ = apiProxyFn$({
		API_TIMEOUT,
		baseUrl: API_SERVER_ROOT_URL,
		duotoneUrls: getDuotoneUrls(duotones, PHOTO_SCALER_SALT),
	});

	/**
	 * This handler converts the application-supplied queries into external API
	 * calls, and converts the API call responses into a standard format that
	 * the application expects.
	 *
	 * @returns Array query responses, which are in the format defined
	 *   by `apiAdapter.apiResponseToQueryResponse`
	 */
	const apiProxyRoute = {
		method: ['GET', 'POST', 'DELETE', 'PATCH'],
		path: '/api',
		handler: (request, reply) => {
			const queryResponses$ = proxyApiRequest$(request);
			queryResponses$.subscribe(
				queryResponses => {
					const response = reply(JSON.stringify(queryResponses)).type('application/json');
					if (queryResponses.find(r => r.type === 'login').length) {
						trackLogin(response);
					}
				},
				(err) => { reply(Boom.badImplementation(err.message)); }
			);
		}
	};

	/**
	 * Only one wildcard route for all application GET requests - exceptions are
	 * described in the routes above
	 */
	const applicationRoute = {
		method: 'GET',
		path: '/{wild*}',
		handler: (request, reply) => {
			const requestLanguage = Accepts(request).language(Object.keys(renderRequestMap));
			request.log(['info'], chalk.green(`Request received for ${request.url.href} (${requestLanguage})`));

			const render$ = request.authorize()  // `authorize()` method is supplied by anonAuthPlugin
				.flatMap(renderRequestMap[requestLanguage])
				.do(() => request.log(['info'], chalk.green('HTML response ready')));

			render$.subscribe(
				({ result, statusCode }) => {
					// response is sent when this function returns (`nextTick`)
					const response = reply(result).code(statusCode);
					trackSession(response);

					if (reply.request.app.setCookies) {
						// when auth cookies are generated on the server rather than the
						// original browser request, we need to send the new cookies
						// back to the browser in the response
						const {
							oauth_token,
							refresh_token,
							expires_in,
							anonymous,
						} = reply.request.state;

						request.log(['info'], chalk.green(`Setting cookies ${Object.keys(reply.request.state)}`));
						response.state('oauth_token', oauth_token, { ttl: expires_in * 1000 });
						response.state('refresh_token', refresh_token, { ttl: YEAR_IN_MS * 2 });
						response.state('anonymous', anonymous.toString(), { ttl: YEAR_IN_MS * 2 });
					}
				}
			);
		}
	};

	return [
		apiProxyRoute,
		applicationRoute,
	];
}

