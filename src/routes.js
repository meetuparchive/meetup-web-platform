import Boom from 'boom';
import Accepts from 'accepts';

import apiProxy$ from './api-proxy';
import { duotones, getDuotoneUrls } from './util/duotone';

export default function getRoutes(
	renderRequestMap,
	{
		API_SERVER_ROOT_URL,
		PHOTO_SCALER_SALT,
		localeCodes
	}) {
	const proxyApiRequest$ = apiProxy$({
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
					reply(JSON.stringify(queryResponses)).type('application/json');
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
			const requestLanguage = Accepts(request).language(localeCodes) || 'en-US';
			request.log(['info'], renderRequestMap[requestLanguage]);
			const render$ = request.authorize()  // `authorize()` method is supplied by anonAuthPlugin
				.flatMap(renderRequestMap[requestLanguage]);

			render$.subscribe(
				({ result, statusCode }) => reply(result).code(statusCode),
				(err) => { reply(Boom.badImplementation(err.message)); }
			);
		}
	};

	return [
		apiProxyRoute,
		applicationRoute,
	];
}

