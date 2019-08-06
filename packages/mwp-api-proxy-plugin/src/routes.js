import Joi from 'joi';
import rison from 'rison';
import { CLICK_PLUGIN_NAME } from 'mwp-tracking-plugin/lib/click';
import { ACTIVITY_PLUGIN_NAME } from 'mwp-tracking-plugin/lib/config';

import { API_ROUTE_PATH } from './config';
import handler from './handler'; // import allows easier mocking in integration tests

const validApiPayloadSchema = Joi.object({
	queries: Joi.string().required(), // should be rison.encode_array-encoded
	metadata: Joi.string(),
	logout: Joi.any(),
	__set_geoip: Joi.string().ip(),
});

const getApiProxyRoutes = path => {
	/**
	 * This handler converts the application-supplied queries into external API
	 * calls, and converts the API call responses into a standard format that
	 * the application expects.
	 *
	 * @returns Array query responses, which are in the format defined
	 *   by `apiAdapter.apiResponseToQueryResponse`
	 */
	const routeBase = {
		path,
		handler,
		options: {
			plugins: {
				'electrode-csrf-jwt': {
					enabled: true,
				},
				'mwp-language-plugin': {
					useReferrerUrlLangCode: true,
				},
				[ACTIVITY_PLUGIN_NAME]: {
					getFields: (request, fields) => {
						const {
							url,
							method,
							payload,
							query,
							info: { referrer },
						} = request;
						const requestReferrer = referrer || '';
						const reqData = method === 'post' ? payload : query;

						// the request may specify a referrer that should be used instead of the `request.referrer`
						// usually set for SPA navigation
						const referrerOverride =
							reqData.metadata &&
							(rison.decode_object(reqData.metadata) || {}).referrer;

						if (referrerOverride) {
							return {
								...fields, // pass along existing standardized_url, standardized_referer
								url: requestReferrer, // navigation requests come from the 'target' url
								referrer: referrerOverride, // navigation referrer is in override
							};
						}

						return {
							...fields,
							url: url.pathname,
							referrer: requestReferrer,
							standardized_url: API_ROUTE_PATH,
							standardized_referer: fields.standardized_url, // the current location supplied by app
						};
					},
				},
				[CLICK_PLUGIN_NAME]: {
					click: request => {
						// only consume click data when the querystring includes `?metadata={clickTracking:true}` (rison-encoded)
						if (!request.query.metadata) {
							return false;
						}
						return Boolean(
							rison.decode_object(request.query.metadata).clickTracking
						);
					},
				},
			},
			state: {
				failAction: 'ignore', // ignore cookie validation, just accept
			},
		},
	};
	const apiGetRoute = {
		...routeBase,
		method: ['GET', 'DELETE'],
		options: {
			...routeBase.options,
			validate: {
				query: validApiPayloadSchema,
			},
		},
	};
	const apiPostRoute = {
		...routeBase,
		method: ['POST', 'PATCH', 'PUT'],
		options: {
			...routeBase.options,
			payload: {
				allow: ['application/x-www-form-urlencoded', 'multipart/form-data'],
				maxBytes: 1024 * 1024 * 10, // 10 MB max upload
			},
		},
	};

	return [apiGetRoute, apiPostRoute];
};

export default getApiProxyRoutes;
