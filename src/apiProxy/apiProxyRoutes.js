import Joi from 'joi';
import {
	duotones,
	getDuotoneUrls
} from '../util/duotone';
import { getApiProxyRouteHandler } from './apiProxyHandler';

const validApiPayloadSchema = Joi.object({
	queries: Joi.string().required(),
	metadata: Joi.string(),
	logout: Joi.any(),
});

const getApiProxyRoutes = (path, env, apiProxyFn$) => {
	const proxyApiRequest$ = apiProxyFn$({
		API_TIMEOUT: env.API_TIMEOUT,
		baseUrl: env.API_SERVER_ROOT_URL,
		duotoneUrls: getDuotoneUrls(duotones, env.PHOTO_SCALER_SALT),
	});

	/**
	 * This handler converts the application-supplied queries into external API
	 * calls, and converts the API call responses into a standard format that
	 * the application expects.
	 *
	 * @returns Array query responses, which are in the format defined
	 *   by `apiAdapter.apiResponseToQueryResponse`
	 */
	const handler = getApiProxyRouteHandler(proxyApiRequest$);

	const apiGetRoute = {
		path,
		handler,
		method: ['GET', 'PATCH'],
		config: {
			validate: {
				query: validApiPayloadSchema
			},
		},
	};
	const apiPostRoute = {
		path,
		handler,
		method: ['POST', 'DELETE'],
		config: {
			validate: {
				payload: validApiPayloadSchema
			},
		},
	};

	return [apiGetRoute, apiPostRoute];
};

export default getApiProxyRoutes;
