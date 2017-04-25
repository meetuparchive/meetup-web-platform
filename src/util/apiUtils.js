import fs from 'fs';

import querystring from 'qs';
import url from 'url';
import uuid from 'uuid';

import externalRequest from 'request';
import Joi from 'joi';
import rison from 'rison';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/defer';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

import {
	removeAuthState,
} from './authUtils';
import {
	coerceBool,
	toCamelCase,
} from './stringUtils';

import {
	querySchema
} from './validation';
import {
	duotoneRef,
} from './duotone';

const MOCK_RESPONSE_OK = {  // minimal representation of http.IncomingMessage
	statusCode: 200,
	statusMessage: 'OK',
	headers: {
		'x-meetup-request-id': 'mock request'
	},
};

function makeMockResponseOk(requestOpts) {
	return {
		...MOCK_RESPONSE_OK,
		request: {
			uri: url.parse(requestOpts.url),
			method: requestOpts.method || 'get',
		},
	};
}

/**
 * Convert the X-Meetup-Variants response header into a state-ready object
 *
 * @see {@link https://meetup.atlassian.net/wiki/display/MUP/X-Meetup-Variants}
 * @returns {Object} {
 *   [experiment]: {
 *     [context (member/chapter id)]: variantName
 *   }
 * }
 */
export const parseVariantsHeader = variantsHeader =>
	variantsHeader.split(' ')
		.reduce((variants, keyval) => {
			const [experiment, val] = keyval.split('=');
			variants[experiment] = variants[experiment] || {};
			const [context, variant] = val.split('|');
			variants[experiment][context] = variant || null;
			return variants;
		}, {});

/**
 * In order to receive cookies from `externalRequest` requests, this function
 * provides a cookie jar that is specific to the request.
 *
 * The `requestUrl` is used to determine whether a cookie jar is needed
 *
 * https://github.com/request/request#examples
 *
 * @param {String} requestUrl the URL that will be used in the external request
 * @return {Object} a cookie jar compatible with the npm request `jar` API
 */
export const createCookieJar = requestUrl => {
	const parsedUrl = url.parse(requestUrl);
	if (parsedUrl.pathname === '/sessions') {
		return externalRequest.jar();  // create request/url-specific cookie jar
	}
	return null;
};

const X_HEADERS = [
	'x-total-count'
];

export const parseMetaHeaders = headers => {
	const meetupHeaders = Object.keys(headers)
		.filter(h => h.startsWith('x-meetup-'))
		.reduce((meta, h) => {
			const key = toCamelCase(h.replace('x-meetup-', ''));
			meta[key] = headers[h];
			return meta;
		}, {});

	// special case handling for flags
	if (meetupHeaders.flags) {
		meetupHeaders.flags = querystring.parse(meetupHeaders.flags, {
			delimiter: ',',
			decoder: coerceBool,
		});
	}

	// special case handling for variants
	if (meetupHeaders.variants) {
		meetupHeaders.variants = parseVariantsHeader(meetupHeaders.variants);
	}

	const xHeaders = X_HEADERS.reduce((meta, h) => {
		const key = toCamelCase(h.replace('x-', ''));
		if (h in headers) {
			meta[key] = headers[h];
		}
		return meta;
	}, {});

	const linkHeader = headers.link && headers.link.split(',')
		.reduce((links, link) => {
			const [urlString, relString] = link.split(';');
			const url = urlString.replace(/<|>/g, '').trim();
			var rel = relString.replace(/rel="([^"]+)"/, '$1').trim();
			links[rel] = url;
			return links;
		}, {});
	const meta = {
		...meetupHeaders,
		...xHeaders,
	};

	if (linkHeader) {
		meta.link = linkHeader;
	}
	return meta;
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
	Observable.of({
		...formatApiError(err),
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
		statusCode: response.statusCode,
	};

	return {
		value: parseApiValue([response, body]),
		meta,
	};

};

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
 * @param {Object} query { endpoint, params, flags }
 *   call)
 * @return {Object} externalRequestOptsQuery argument for the call to
 *   `externalRequest` for the query
 */
export const buildRequestArgs = externalRequestOpts =>
	({ endpoint, params, flags, meta={} }) => {
		const dataParams = querystring.stringify(params);
		const headers = { ...externalRequestOpts.headers };
		let url = encodeURI(`/${endpoint}`);
		let body;
		const jar = createCookieJar(url);

		if (flags || meta.flags) {
			headers['X-Meetup-Request-Flags'] = (flags || meta.flags).join(',');
		}

		if (meta.variants) {
			headers['X-Meetup-Variants'] = Object.keys(meta.variants)
				.reduce((header, experiment) => {
					const context = meta.variants[experiment];
					const contexts = context instanceof Array ? context : [context];
					header += contexts.map(c => `${experiment}=${c}`).join(' ');
					return header;
				});
		}

		switch (externalRequestOpts.method) {
		case 'patch':
		case 'post':
			if (externalRequestOpts.formData) {
				break;
			}
			body = dataParams;
			headers['content-type'] = 'application/x-www-form-urlencoded';
			break;
		case 'delete':
		case 'get':
		default:
			url += `?${dataParams}`;
			headers['content-type'] = 'application/json';
			headers['X-Meta-Photo-Host'] = 'secure';
		}

		const externalRequestOptsQuery = {
			...externalRequestOpts,
			headers,
			jar,
			url,
		};

		// only add body if defined
		if (body) {
			externalRequestOptsQuery.body = body;
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

export function getAuthHeaders(request) {
	const oauth_token = request.state.oauth_token ||  // browser-based requests
		request.plugins.requestAuth.oauth_token;  // internal server requests
	if (!request.state.MEETUP_MEMBER && oauth_token) {
		return {
			authorization: `Bearer ${oauth_token}`,
		};
	}
	const cookies = { ...request.state };
	const csrf = uuid.v4();
	cookies.MEETUP_CSRF = csrf;
	cookies.MEETUP_CSRF_DEV = csrf;
	const cookie = Object.keys(cookies)
		.map(name => `${name}=${cookies[name]}`).join('; ');

	return {
		cookie,
		'csrf-token': csrf,
	};
}

export function parseRequestHeaders(request) {
	const externalRequestHeaders = {
		...request.headers,
		...getAuthHeaders(request),
	};

	delete externalRequestHeaders['host'];  // let app server set 'host'
	delete externalRequestHeaders['accept-encoding'];  // let app server set 'accept'
	delete externalRequestHeaders['content-length'];  // original request content-length is irrelevant
	delete externalRequestHeaders['content-type'];  // the content type will be set in buildRequestArgs

	// cloudflare headers we don't want to pass on
	delete externalRequestHeaders['cf-ray'];
	delete externalRequestHeaders['cf-ipcountry'];
	delete externalRequestHeaders['cf-visitor'];
	delete externalRequestHeaders['cf-connecting-ip'];

	return externalRequestHeaders;
}

export function parseRequestQueries(request) {
	const {
		method,
		mime,
		payload,
		query,
	} = request;
	const queriesRison = (method === 'post' || method === 'patch') &&
		mime !== 'multipart/form-data' ?
			payload.queries :
			query.queries;

	if (!queriesRison) {
		return null;
	}

	const validatedQueries = Joi.validate(
		rison.decode_array(queriesRison),
		Joi.array().items(querySchema)
	);
	if (validatedQueries.error) {
		throw validatedQueries.error;
	}
	return validatedQueries.value;
}

/**
 * Parse request for queries and request options
 * @return {Object} { queries, externalRequestOpts }
 */
export function parseRequest(request) {
	const baseUrl = request.server.app.API_SERVER_ROOT_URL;
	const externalRequestOpts = {
		baseUrl,
		method: request.method,
		headers: parseRequestHeaders(request),  // make a copy to be immutable
		mode: 'no-cors',
		time: true,  // time the request for logging
		agentOptions: {
			rejectUnauthorized: baseUrl.indexOf('.dev') === -1
		},
	};
	if (request.mime === 'multipart/form-data') {
		// the parsed payload includes string key-value pairs for regular inputs,
		// and file descriptors for file upload inputs { filename, path, headers }
		// The file descriptors can be converted to readable streams for the API
		// request.
		externalRequestOpts.formData = Object.keys(request.payload)
			.reduce((formData, key) => {
				const value = request.payload[key];
				if (value.filename) {
					formData[key] = {
						value: fs.createReadStream(value.path),
						options: {
							filename: value.filename,
							contentType: value.headers['content-type'],
						},
					};
					request.app.upload = value.path;
				} else {
					formData[key] = value;
				}
				return formData;
			}, {});
	}
	return {
		externalRequestOpts,
		queries: parseRequestQueries(request),
	};
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
	const photo = group.key_photo || {};
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
	Observable.of([makeMockResponseOk(requestOpts), JSON.stringify(mockResponse)])
		.do(() => console.log(`MOCKING response to ${requestOpts.url}`));

const externalRequest$ = Observable.bindNodeCallback(externalRequest);
/**
 * Make a real external API request, return response body string
 */
export const makeExternalApiRequest = request => requestOpts => {
	return externalRequest$(requestOpts)
		.do(  // log errors
			null,
			err => {
				console.error(JSON.stringify({
					err: err.stack,
					message: 'REST API request error',
					request: {
						id: request.id
					},
					context: requestOpts,
				}));
			}
		)
		.timeout(request.server.app.API_TIMEOUT)
		.map(([response, body]) => [response, body, requestOpts.jar]);
};

export const logApiResponse = request => ([response, body]) => {
	const {
		elapsedTime,
		request :{
			id,
			uri: {
				query,
				pathname,
				href,
			},
			method,
		},
		statusCode
	} = response;

	// production logs will automatically be JSON-parsed in Stackdriver
	const log = statusCode >= 400 && console.error ||
		statusCode >= 300 && console.warn ||
		console.log;

	log(JSON.stringify({
		message: `Incoming response ${method.toUpperCase()} ${pathname} ${response.statusCode}`,
		type: 'response',
		direction: 'in',
		info: {
			url: href,
			query: (query || '').split('&').reduce((acc, keyval) => {
				const [key, val] = keyval.split('=');
				acc[key] = val;
				return acc;
			}, {}),
			method,
			id,
			originRequestId: request.id,
			statusCode: statusCode,
			time: elapsedTime,
			body: body.length > 256 ? `${body.substr(0, 256)}...`: body,
		}
	}));
};

/**
 * Login responses contain oauth info that should be applied to the response.
 * If `request.plugins.requestAuth.reply` exists (supplied by the requestAuthPlugin),
 * the application is able to set cookies on the response. Otherwise, return
 * the login response unchanged
 */
export const parseLoginAuth = (request, query) => response => {
	if (query.type === 'login' && request.plugins.requestAuth && !response.value.error) {
		// kill the logged-out auth
		removeAuthState(['oauth_token', 'refresh_token'], request, request.plugins.requestAuth.reply);
		// only return the member, no oauth data
		return {
			...response,
			value: { member: response.value.member }
		};
	}
	return response;
};

/**
 * When a tough-cookie cookie jar is provided, forward the cookies along with
 * the overall /api response back to the client
 */
export const injectResponseCookies = request => ([response, _, jar]) => {
	if (!jar) {
		return;
	}
	const requestUrl = response.toJSON().request.uri.href;
	jar.getCookies(requestUrl).forEach(cookie => {
		const cookieOptions = {
			domain: cookie.domain,
			path: cookie.path,
			isHttpOnly: cookie.httpOnly,
			isSameSite: false,
			isSecure: process.env.NODE_ENV === 'production',
			strictHeader: false,  // Can't enforce RFC 6265 cookie validation on external services
		};

		request.plugins.requestAuth.reply.state(
			cookie.key,
			cookie.value,
			cookieOptions
		);
	});
};

/**
 * Make an API request and parse the response into the expected `response`
 * object shape
 */
export const makeApiRequest$ = request => {
	const setApiResponseDuotones = apiResponseDuotoneSetter(request.server.app.duotoneUrls);
	return ([requestOpts, query]) => {
		const request$ = query.mockResponse ?
			makeMockRequest(query.mockResponse) :
			makeExternalApiRequest(request);

		return Observable.defer(() => {
			const {
				method,
				headers,
			} = requestOpts;

			const parsedUrl = url.parse(requestOpts.url);
			console.log(JSON.stringify({
				message: `Outgoing request ${requestOpts.method.toUpperCase()} ${parsedUrl.pathname}`,
				type: 'request',
				direction: 'out',
				info: {
					headers,
					url: parsedUrl,
					method,
				},
			}));

			return request$(requestOpts)
				.do(logApiResponse(request))             // this will leak private info in API response
				.do(injectResponseCookies(request))
				.map(parseApiResponse(requestOpts.url))  // parse into plain object
				.catch(errorResponse$(requestOpts.url))
				.map(parseLoginAuth(request, query))     // login has oauth secrets - special case
				.map(apiResponseToQueryResponse(query))  // convert apiResponse to app-ready queryResponse
				.map(setApiResponseDuotones);            // special duotone prop
		});
	};
};

