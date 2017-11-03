import http from 'http';
import fs from 'fs';

import querystring from 'qs';
import url from 'url';
import uuid from 'uuid';

import externalRequest from 'request';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/defer';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

import config from 'mwp-cli/src/config';

import { API_PROXY_PLUGIN_NAME } from '../config';

export const API_META_HEADER = 'X-Meta-Request-Headers';

const MOCK_RESPONSE_OK = {
	// minimal representation of http.IncomingMessage
	statusCode: 200,
	statusMessage: 'OK',
};
const API_TIMEOUT_RESPONSE = {
	statusCode: 408,
	statusMessage: 'API Request Timeout',
};
const makeAPIErrorResponse = err => ({
	statusCode: 500,
	statusMessage: err.message,
});

/*
 * When an API response is being mocked (dev only), this response will be used
 */
function makeMockResponse(requestOpts, response = MOCK_RESPONSE_OK) {
	const mockResponse = new http.IncomingMessage();

	return Object.assign(mockResponse, {
		...response,
		headers: {
			'x-meetup-request-id': 'mock-request',
		},
		method: requestOpts.method || 'get',
		request: {
			uri: url.parse(requestOpts.url),
			method: requestOpts.method || 'get',
			headers: requestOpts.headers,
		},
	});
}

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
		return externalRequest.jar(); // create request/url-specific cookie jar
	}
	return null;
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
export const buildRequestArgs = externalRequestOpts => ({
	endpoint,
	params,
	flags,
	meta = {},
}) => {
	const dataParams = querystring.stringify(params);
	const headers = { ...externalRequestOpts.headers };
	// endpoint may or may not be URI-encoded, so we decode before encoding
	let url = encodeURI(`/${decodeURI(endpoint)}`);
	let body;
	const jar = createCookieJar(url);

	if (flags || meta.flags) {
		headers['X-Meetup-Request-Flags'] = (flags || meta.flags).join(',');
	}

	if (meta.metaRequestHeaders) {
		headers[API_META_HEADER] = meta.metaRequestHeaders.join(',');
	}

	if (meta.variants) {
		headers['X-Meetup-Variants'] = Object.keys(
			meta.variants
		).reduce((header, experiment) => {
			const context = meta.variants[experiment];
			const contexts = context instanceof Array ? context : [context];
			header += contexts.map(c => `${experiment}=${c}`).join(' ');
			return header;
		}, '');
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
		timeout: externalRequestOpts.formData
			? 60 * 1000 // 60sec upload timeout
			: externalRequestOpts.timeout,
	};

	// only add body if defined
	if (body) {
		externalRequestOptsQuery.body = body;
	}

	return externalRequestOptsQuery;
};

export function getAuthHeaders(request) {
	const oauth_token =
		request.state.oauth_token || request.plugins.requestAuth.oauth_token; // browser-based requests // internal server requests
	if (!request.state.MEETUP_MEMBER && oauth_token) {
		return {
			authorization: `Bearer ${oauth_token}`,
		};
	}

	// Cookie + CSRF auth: need have matching UUID in MEETUP_CSRF cookie and 'csrf-token' header
	const cookies = { ...request.state };
	const csrfCookie =
		process.env.NODE_ENV === 'production'
			? cookies.MEETUP_CSRF
			: cookies.MEETUP_CSRF_DEV;
	if (csrfCookie) {
		// only need to set csrf-token - existing cookie header will be passed in unmodified
		return { 'csrf-token': csrfCookie };
	}
	// create a new cookie + header
	const csrf = uuid.v4();
	cookies.MEETUP_CSRF = csrf;
	cookies.MEETUP_CSRF_DEV = csrf;
	const cookie = Object.keys(cookies)
		.map(name => `${name}=${cookies[name]}`)
		.join('; ');

	return {
		cookie,
		'csrf-token': csrf,
	};
}

export function getLanguageHeader(request) {
	const requestLang = request.getLanguage();
	const headerLang = request.headers['accept-language'];
	const acceptLang =
		requestLang && headerLang
			? `${requestLang},${headerLang}`
			: requestLang || headerLang;
	return acceptLang;
}

export function getClientIpHeader(request) {
	const clientIP =
		request.query['_set_geoip'] || request.headers['fastly-client-ip'];
	if (clientIP) {
		return { 'X-Meetup-Client-Ip': clientIP };
	}
}

export function parseRequestHeaders(request) {
	const externalRequestHeaders = {
		...request.headers,
		...getAuthHeaders(request),
		...getClientIpHeader(request),
		'accept-language': getLanguageHeader(request),
		'x-meetup-agent': config.package.agent,
		'x-meetup-parent-request-id': request.id,
	};

	delete externalRequestHeaders['host']; // let app server set 'host'
	delete externalRequestHeaders['accept-encoding']; // let app server set 'accept'
	delete externalRequestHeaders['content-length']; // original request content-length is irrelevant
	delete externalRequestHeaders['content-type']; // the content type will be set in buildRequestArgs

	return externalRequestHeaders;
}

/*
 * In multipart form requests, the parsed payload includes string key-value
 * pairs for regular inputs, and file descriptors for file upload inputs
 * ({ filename, path, headers }). This function passes through regular input
 * values unchanged, but converts the file descriptors to readable file streams
 * that will be proxied to the REST API.
 * 
 * References to the uploaded files are stored here for cleanup later on.
 */
export function parseMultipart(payload, uploadsList) {
	return Object.keys(payload).reduce((formData, key) => {
		const value = payload[key];
		if (value.filename) {
			formData[key] = {
				value: fs.createReadStream(value.path),
				options: {
					filename: value.filename,
					contentType: value.headers['content-type'],
				},
			};
			uploadsList.push(value.path);
		} else {
			formData[key] = value;
		}
		return formData;
	}, {});
}

/*
 * Translate the incoming Hapi request into an 'opts' object that can be used
 * to call `request` for the REST API. This function essentially translates the
 * app server request properties (headers, payload) into corresponding REST API
 * request properties. The resulting value will be used as the _base_ set of
 * options for _every_ parallel REST API request made by the platform
 * corresponding to single incoming request.
 * 
 * @return {Object} externalRequestOpts
 */
export function getExternalRequestOpts(request) {
	const { api } = request.server.settings.app;
	const externalRequestOpts = {
		baseUrl: api.root_url,
		method: request.method,
		headers: parseRequestHeaders(request),
		mode: 'no-cors',
		time: true, // time the request for logging
		timeout: api.timeout,
		agentOptions: {
			rejectUnauthorized: api.root_url.indexOf('.dev') === -1,
		},
	};
	if (request.mime === 'multipart/form-data') {
		// multipart form data needs special treatment
		externalRequestOpts.formData = parseMultipart(
			request.payload,
			request.plugins[API_PROXY_PLUGIN_NAME].uploads
		);
	}
	return externalRequestOpts;
}

/**
 * Fake an API request and directly return the stringified mockResponse
 */
export const makeMockRequest = (
	mockResponseContent,
	responseMeta
) => requestOpts =>
	Observable.of([
		makeMockResponse(requestOpts),
		JSON.stringify(mockResponseContent),
	]);

const externalRequest$ = Observable.bindNodeCallback(externalRequest);
/**
 * Make a real external API request, return response body string
 */
export const makeExternalApiRequest = request => requestOpts => {
	return externalRequest$(requestOpts)
		.catch(err => {
			const errorObj = { errors: [err] };
			if (err.code === 'ETIMEDOUT') {
				request.server.app.logger.error({
					err,
					externalRequest: requestOpts,
					...request.raw,
				});
				return makeMockRequest(errorObj, API_TIMEOUT_RESPONSE)(requestOpts);
			}
			return makeMockRequest(errorObj, makeAPIErrorResponse(err))(requestOpts);
		})
		.map(([response, body]) => [response, body, requestOpts.jar]);
};

/*
 * Make an API request and parse the response into the expected `response`
 * object shape
 */
export const makeSend$ = request => {
	// 1. get the queries and the shared `externalRequestOpts` from the request
	//    that will be applied to all queries
	const externalRequestOpts = getExternalRequestOpts(request);

	// 2. create a function that uses `externalRequestOpts` as a base from which
	//    to build query-specific API request options objects
	const queryToRequestOpts = buildRequestArgs(externalRequestOpts);

	return query => {
		const requestOpts = queryToRequestOpts(query);
		const request$ = query.mockResponse
			? makeMockRequest(query.mockResponse)
			: makeExternalApiRequest(request);

		return Observable.defer(() => request$(requestOpts));
	};
};
