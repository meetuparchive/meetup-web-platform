import querystring from 'querystring';
import url from 'url';

import externalRequest from 'request';
import Joi from 'joi';
import Rx from 'rxjs';

import {
	applyAuthState,
} from '../util/authUtils';

import {
	querySchema
} from './validation';
import { duotoneRef } from './duotone';
import * as apiConfigCreators from '../apiProxy/apiConfigCreators';

const MOCK_RESPONSE_OK = {  // minimal representation of http.IncomingMessage
	statusCode: 200,
	statusMessage: 'OK',
	headers: {
		'x-meetup-request-id': 'mock request'
	},
	request: {
		uri: {},
	},
};

const parseResponseFlags = flagHeader =>
	(flagHeader || '')
		.split(',')
		.filter(pair => pair)  // ignore empty elements in the array
		.map(pair => pair.split('='))
		.reduce((flags, [key, val]) => {
			flags[key] = val === 'true';
			return flags;
		}, {});

export const parseMetaHeaders = headers => {
	const flags = parseResponseFlags(headers['x-meetup-flags']);
	const requestId = headers['x-meetup-request-id'];
	return {
		flags,
		requestId,
	};
};

/**
 * Accept an Error and return an object that will be used in place of the
 * expected API return value
 */
function formatApiError(err) {
	return {
		error: err.message
	};
}

export const errorResponse$ = requestUrl => err =>
	Rx.Observable.of({
		value: formatApiError(err),
		meta: {
			endpoint: url.parse(requestUrl).pathname,
		},
	});

export const parseApiValue = ([response, body]) => {
	// treat non-success HTTP code as an error
	if (response.statusCode < 200 || response.statusCode > 299) {
		return formatApiError(new Error(response.statusMessage));
	}
	try {
		if (response.statusCode === 204) {  // NoContent response type
			return null;
		}

		const value = JSON.parse(body);
		if (value && value.problem) {
			return formatApiError(new Error(`API problem: ${value.problem}: ${value.details}`));
		}
		return value;
	} catch(err) {
		return formatApiError(err);
	}
};

/**
 *
 * mostly error handling - any case where the API does not satisfy the
 * "api response" formatting requirement: plain object containing the requested
 * values
 *
 * This utility is specific to the response format of the API being consumed
 * @param {Array} the callback args for npm request - [response, body], where
 * `response` is an `Http.IncomingMessage` and `body` is the body text of the
 * response.
 * @return responseObj the JSON-parsed text, possibly with error info
 */
export const parseApiResponse = requestUrl => ([response, body]) => {
	const meta = {
		...parseMetaHeaders(response.headers),
		endpoint: url.parse(requestUrl).pathname,
	};

	return {
		value: parseApiValue([response, body]),
		meta,
	};

};

/**
 * Translate a query into an API `endpoint` + `params`. The translation is based
 * on the Meetup REST API.
 *
 * This function serves as an adapter between the structure of a query and the
 * API-specific config needed to get that data. Note that *each* required
 * endpoint needs to be manually configured
 *
 * {@link http://www.meetup.com/meetup_api/docs/batch/}
 *
 * @param {Object} query a query object from the application
 * @return {Object} the arguments for api request, including endpoint
 */
export function queryToApiConfig({ endpoint, ref, type, params, flags }) {
	if (!endpoint) {
		console.warn(
			'Queries without an explicit `endpoint` key are deprecated.',
			'Please specify the endpoint and params in the query function directly.',
			`Query: ${JSON.stringify({ ref, type })}`
		);
		if (!(type in apiConfigCreators)) {
			throw new ReferenceError(`No API specified for query type ${type} and no endpoint provided`);
		}
		const baseConfig = apiConfigCreators[type](params);
		endpoint = baseConfig.endpoint;
		params = baseConfig.params;
	}
	return {
		endpoint,
		params,
		flags,
	};
}

/**
 * Transform each query into the arguments needed for a `request` call.
 *
 * Some request options are constant for all queries, and these are curried into
 * a function that can be called with a single query as part of the request
 * stream
 *
 * @see {@link https://www.npmjs.com/package/request}
 *
 * @param {Object} externalRequestOpts request options that will be applied to
 *   every query request
 * @param {Object} apiConfig { endpoint, params, flags }
 *   call)
 * @return {Object} externalRequestOptsQuery argument for the call to
 *   `externalRequest` for the query
 */
export const buildRequestArgs = externalRequestOpts =>
	({ endpoint, params, flags }) => {

		// cheap, brute-force object clone, acceptable for serializable object
		const externalRequestOptsQuery = JSON.parse(JSON.stringify(externalRequestOpts));
		externalRequestOptsQuery.url = encodeURI(`/${endpoint}`);

		if (flags) {
			externalRequestOptsQuery.headers['X-Meetup-Request-Flags'] = flags.join(',');
		}

		const dataParams = querystring.stringify(params);

		switch (externalRequestOptsQuery.method) {
		case 'get':
		case 'delete':
			externalRequestOptsQuery.url += `?${dataParams}`;
			externalRequestOptsQuery.headers['X-Meta-Photo-Host'] = 'secure';
			break;
		case 'post':
			externalRequestOptsQuery.body = dataParams;
			externalRequestOptsQuery.headers['content-type'] = 'application/x-www-form-urlencoded';
			break;
		}

		return externalRequestOptsQuery;
	};

/**
 * Format apiResponse to match expected state structure
 *
 * @param {Object} apiResponse JSON-parsed api response data
 */
export const apiResponseToQueryResponse = query => ({ value, meta }) => ({
	[query.ref]: {
		type: query.type,
		value,
		meta
	}
});

/**
 * Parse request for queries and request options
 * @return {Object} { queries, externalRequestOpts }
 */
export function parseRequest(request, baseUrl) {
	const {
		headers,
		method,
		query,
		payload,
		state,
	} = request;

	// Forward the Hapi request headers from the client query
	// except for `host` and `accept-encoding`
	// which should be provided by the external api request
	const externalRequestHeaders = {
		...headers,
		authorization: `Bearer ${state.oauth_token}`,
	};

	delete externalRequestHeaders['host'];
	delete externalRequestHeaders['accept-encoding'];
	delete externalRequestHeaders['content-length'];  // original request content-length is irrelevant

	const externalRequestOpts = {
		baseUrl,
		method,
		headers: externalRequestHeaders,  // make a copy to be immutable
		mode: 'no-cors',
		time: true,
		agentOptions: {
			rejectUnauthorized: baseUrl.indexOf('.dev') === -1
		}
	};

	const queriesJSON = request.method === 'post' ? payload.queries : query.queries;
	const validatedQueries = Joi.validate(
		JSON.parse(queriesJSON),
		Joi.array().items(querySchema)
	);
	if (validatedQueries.error) {
		throw validatedQueries.error;
	}
	const queries = validatedQueries.value;
	return { queries, externalRequestOpts };
}

/**
 * From a provided set of signed duotone URLs, create a function that injects
 * the full duotone URL into a group object with the key `duotoneUrl`.
 *
 * @param {Object} duotoneUrls map of `[duotoneRef]: url template root`
 * @param {Object} group group object from API
 * @return {Object} the mutated group object
 */
export const groupDuotoneSetter = duotoneUrls => group => {
	const photo = group.key_photo || group.group_photo || {};
	const duotoneKey = group.photo_gradient && duotoneRef(
			group.photo_gradient.light_color,
			group.photo_gradient.dark_color
		);
	const duotoneUrlRoot = duotoneKey && duotoneUrls[duotoneKey];
	if (duotoneUrlRoot && photo.id) {
		group.duotoneUrl = `${duotoneUrlRoot}/${photo.id}.jpeg`;
	}
	return group;
};

/**
 * From a provided set of signed duotoneUrls, create a function that injects
 * the full duotone URL into an query response containing objects that support
 * duotoned images (anything containing group or event objects
 *
 * @param {Object} duotoneUrls map of `[duotoneRef]: url template root`
 * @param {Object} queryResponse { type: <type>, value: <API object> }
 * @return {Object} the modified queryResponse
 */
export const apiResponseDuotoneSetter = duotoneUrls => {
	const setGroupDuotone = groupDuotoneSetter(duotoneUrls);
	return queryResponse => {
		// inject duotone URLs into any group query response
		Object.keys(queryResponse)
			.forEach(key => {
				const { type, value } = queryResponse[key];
				if (!value || value.error) {
					return;
				}
				let groups;
				switch (type) {
				case 'group':
					groups = value instanceof Array ? value : [value];
					groups.forEach(setGroupDuotone);
					break;
				case 'home':
					(value.rows || []).map(({ items }) => items)
						.forEach(items => items.filter(({ type }) => type === 'group')
							.forEach(({ group }) => setGroupDuotone(group))
						);
					break;
				}
			});
		return queryResponse;
	};
};

/**
 * Fake an API request and directly return the stringified mockResponse
 */
export const makeMockRequest = mockResponse => requestOpts =>
	Rx.Observable.of([MOCK_RESPONSE_OK, JSON.stringify(mockResponse)])
		.do(() => console.log(`MOCKING response to ${requestOpts.url}`));

const externalRequest$ = Rx.Observable.bindNodeCallback(externalRequest);
/**
 * Make a real external API request, return response body string
 */
export const makeExternalApiRequest = (request, API_TIMEOUT) => requestOpts =>
	externalRequest$(requestOpts)
		.timeout(API_TIMEOUT);

export const logApiResponse = appRequest => ([response, body]) => {
	const {
		uri: {
			query,
			pathname,
		},
		method,
	} = response.request;

	const responseLog = {
		request: {
			query: (query || '').split('&').reduce((acc, keyval) => {
				const [key, val] = keyval.split('=');
				acc[key] = val;
				return acc;
			}, {}),
			pathname,
			method,
		},
		response: {
			elapsedTime: response.elapsedTime,
			body: body.length > 256 ? `${body.substr(0, 256)}...`: body,
		},
	};
	appRequest.log(['api', 'info'], JSON.stringify(responseLog, null, 2));
};

/**
 * Login responses contain oauth info that should be applied to the response.
 * If `request.plugins.requestAuth.reply` exists (supplied by the requestAuthPlugin),
 * the application is able to set cookies on the response. Otherwise, return
 * the login response unchanged
 */
export const parseLoginAuth = (request, query) => response => {
	if (query.type === 'login' && request.plugins.requestAuth) {
		const {
			oauth_token,
			refresh_token,
			expires_in,
			member,
		} = response.value;
		applyAuthState(request, request.plugins.requestAuth.reply)({
			oauth_token,
			refresh_token,
			expires_in
		});
		response.value = { member };
	}
	return response;
};

/**
 * Make an API request and parse the response into the expected `response`
 * object shape
 */
export const makeApiRequest$ = (request, API_TIMEOUT, duotoneUrls) => {
	const setApiResponseDuotones = apiResponseDuotoneSetter(duotoneUrls);
	return ([requestOpts, query]) => {
		const request$ = query.mockResponse ?
			makeMockRequest(query.mockResponse) :
			makeExternalApiRequest(request, API_TIMEOUT);

		return Rx.Observable.defer(() => {
			request.log(['api', 'info'], `REST API request: ${requestOpts.url}`);
			return request$(requestOpts)
				.do(logApiResponse(request))             // this will leak private info in API response
				.map(parseApiResponse(requestOpts.url))  // parse into plain object
				.catch(errorResponse$(requestOpts.url))
				.map(parseLoginAuth(request, query))     // login has oauth secrets - special case
				.map(apiResponseToQueryResponse(query))  // convert apiResponse to app-ready queryResponse
				.map(setApiResponseDuotones);            // special duotone prop
		});
	};
};

