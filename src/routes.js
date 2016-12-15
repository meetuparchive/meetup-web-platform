import url from 'url';

import Accepts from 'accepts';
import Boom from 'boom';
import chalk from 'chalk';
import Joi from 'joi';

import apiProxy$ from './apiProxy/api-proxy';

import {
	duotones,
	getDuotoneUrls
} from './util/duotone';

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

	const handleQueryResponses = (request, reply) => queryResponses => {
		const response = reply(JSON.stringify(queryResponses))
			.type('application/json');

		const payload = (request.method === 'post' || request.method === 'delete') ?
			request.payload :
			request.query;

		const metadata = JSON.parse(payload.metadata || '{}');
		const originUrl = response.request.info.referrer;
		metadata.url = url.parse(originUrl).pathname;
		metadata.method = response.request.method;

		reply.track(
			response,
			'api',
			queryResponses,
			metadata
		);
	};

	const validApiPayloadSchema = Joi.object({
		queries: Joi.string().required(),
		metadata: Joi.string(),
		logout: Joi.any(),
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
		path: '/api',
		handler: (request, reply) => {
			proxyApiRequest$(request)
				.subscribe(
					handleQueryResponses(request, reply),
					(err) => { reply(Boom.badImplementation(err.message)); }
				);
		}
	};
	const plugins = {
		'electrode-csrf-jwt': {
			enabled: true,
		}
	};
	const apiGetRoute = {
		...apiProxyRoute,
		method: ['GET', 'PATCH'],
		config: {
			plugins,
			validate: {
				query: validApiPayloadSchema
			},
		},
	};
	const apiPostRoute = {
		...apiProxyRoute,
		method: ['POST', 'DELETE'],
		config: {
			plugins,
			validate: {
				payload: validApiPayloadSchema
			},
		},
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

			return renderRequestMap[requestLanguage](request)
				.do(() => request.log(['info'], chalk.green('HTML response ready')))
				.subscribe(({ result, statusCode }) => {
					// response is sent when this function returns (`nextTick`)
					const response = reply(result)
						.code(statusCode);

					reply.track(response, 'session');
				});
		},
	};

	return [
		apiGetRoute,
		apiPostRoute,
		applicationRoute,
	];
}

