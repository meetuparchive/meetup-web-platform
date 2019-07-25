import http from 'http';

import querystring from 'qs';
import url from 'url';

import _doRequest from 'request';

import config from 'mwp-config';

export const API_META_HEADER = 'X-Meta-Request-Headers';
const FULL_URL_PATTERN = /^https?:\/\//;

// create a promisified version of `_doRequest` - can't use `util.promisify`
// because the callback gets 2 additional arguments, and promisify only supports 1.
const doRequest = options =>
	new Promise((resolve, reject) => {
		_doRequest(options, (err, response, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve([response, body]); // emit response and body as tuple
		});
	});

const _makeGetCookieNames = () => {
	// memoize the cookie names - they don't change
	let memberCookieName;
	let csrfCookieName;
	return request => {
		if (!memberCookieName) {
			memberCookieName = request.server.settings.app.api.isProd
				? 'MEETUP_MEMBER'
				: 'MEETUP_MEMBER_DEV';
		}
		if (!csrfCookieName) {
			csrfCookieName = request.server.settings.app.api.isProd
				? 'MEETUP_CSRF'
				: 'MEETUP_CSRF_DEV';
		}

		return {
			memberCookieName,
			csrfCookieName,
		};
	};
};
const getCookieNames = _makeGetCookieNames();

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
 * Function to build argument for `request` for API requests to DIY edge endpoints,
 * i.e. endpoints served on a domain other than api.meetup.com
 *
 * Currently, cookies cannot be set by DIY edge endpoints. (e.g. using the
 * `jar` interface in `request`)
 */
const buildGenericRequestArgs = requestOpts => {
	// make a copy of the 'global' headers set for all queries.
	const headers = { ...requestOpts.headers };
	// all DIY edges support JSON bodies for all methods
	headers['content-type'] = 'application/json';
	// strip clicktracking cookie 'click-track'
	headers.cookie = headers.cookie.replace(/\s+?click-track=[^;]+/, '');

	return query => {
		let body;

		// create properly-escaped URL from endpoint
		const url = new URL(query.endpoint);

		switch (requestOpts.method) {
			case 'patch':
			case 'put':
			case 'post':
				if (requestOpts.formData) {
					break;
				}
				// assume all DIY edge endpoints handle JSON body encoding
				body = JSON.stringify(query.params);
				break;
			case 'delete':
			case 'get':
			default: {
				// copy query object params into `url.searchParams`
				for (const p of new URLSearchParams(query.params)) {
					url.searchParams.append(...p);
				}
			}
		}
		const queryRequestOpts = {
			...requestOpts,
			headers,
			url: url.toString(),
			baseUrl: undefined, // allow fully-qualified URL to override baseUrl
			timeout: requestOpts.formData
				? 60 * 1000 // 60sec upload timeout
				: requestOpts.timeout,
		};

		// only add body if defined
		if (body) {
			queryRequestOpts.body = body;
		}

		return queryRequestOpts;
	};
};

/**
 * Shared edge (api.meetup.com) requests have special features that are enabled
 * by this request arg builder, e.g.
 *
 * - 'set cookie' for login requests to /sessions (not used)
 */
const buildSharedEdgeRequestArgs = requestOpts => query => {
	const { endpoint, params, flags, meta = {} } = query;
	const dataParams = querystring.stringify(params);
	const headers = { ...requestOpts.headers };
	// endpoint may or may not be URI-encoded, so we decode before encoding
	const encodedUrl = encodeURI(decodeURI(endpoint));
	// add leading slash
	let url = `/${encodedUrl}`;
	let body;

	if (flags || meta.flags) {
		headers['X-Meetup-Request-Flags'] = (flags || meta.flags).join(',');
	}

	if (meta.metaRequestHeaders) {
		headers[API_META_HEADER] = meta.metaRequestHeaders.join(',');
	}

	// @deprecated
	if (meta.variants) {
		headers['X-Meetup-Variants'] = Object.keys(meta.variants).reduce(
			(header, experiment) => {
				const context = meta.variants[experiment];
				const contexts = context instanceof Array ? context : [context];
				header += contexts.map(c => `${experiment}=${c}`).join(' ');
				return header;
			},
			''
		);
	}

	switch (requestOpts.method) {
		case 'patch':
		case 'put':
		case 'post':
			if (requestOpts.formData) {
				break;
			}
			body = dataParams;
			headers['content-type'] = 'application/x-www-form-urlencoded';
			break;
		case 'delete':
		case 'get':
		default:
			url += dataParams ? `?${dataParams}` : '';
			headers['content-type'] = 'application/json';
			headers['X-Meta-Photo-Host'] = 'secure';
	}

	const queryRequestOpts = {
		...requestOpts,
		headers,
		url,
		timeout: requestOpts.formData
			? 60 * 1000 // 60sec upload timeout
			: requestOpts.timeout,
	};

	// only add body if defined
	if (body) {
		queryRequestOpts.body = body;
	}

	return queryRequestOpts;
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
 * @param {Object} requestOpts request options that will be applied to
 *   every query request
 * @param {Object} query { endpoint, params, flags }
 *   call)
 * @return {Object} queryRequestOpts argument for the call to
 *   `_doRequest` for the query
 */
export const buildRequestArgs = requestOpts => query => {
	// if the query.endpoint is fully-qualified URL, that indicates that it
	// is _not_ a request to the shared Edge API (api.meeetup.com), and therefore
	// does not need the shared-edge-specific request functionality (e.g. special
	// headers, click-tracking cookies)
	const requestArgBuilder = FULL_URL_PATTERN.test(query.endpoint)
		? buildGenericRequestArgs(requestOpts)
		: buildSharedEdgeRequestArgs(requestOpts);
	return requestArgBuilder(query);
};

export function getAuthHeaders(request) {
	// Cookie + CSRF auth: need have matching UUID in MEETUP_CSRF cookie and 'csrf-token' header
	// Valid cookie and CSRF are supplied by mwp-auth-plugin in request.auth.credentials
	const cookies = { ...request.state };
	const { memberCookieName, csrfCookieName } = getCookieNames(request);
	const { memberCookie, csrfToken } = request.auth.credentials; // set by mwp-auth plugin

	cookies[memberCookieName] = memberCookie;
	cookies[csrfCookieName] = csrfToken;

	// rebuild a cookie header string from the parsed `cookies` object
	const cookie = Object.keys(cookies)
		.map(name => `${name}=${cookies[name]}`)
		.join('; ');

	return {
		cookie,
		'csrf-token': csrfToken,
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
	const clientIP = request.query.__set_geoip || request.headers['fastly-client-ip'];
	if (clientIP) {
		return { 'X-Meetup-Client-Ip': clientIP };
	}
	return {};
}

export function getTrackingHeaders(request) {
	// email tracking with _xtd query param: https://meetup.atlassian.net/wiki/spaces/DAT/pages/27754630/Email+Tracking

	// request protocol and host might be different from original request that hit proxy
	// we want to use the proxy's protocol and host
	const requestProtocol = request.headers['x-forwarded-proto'];
	const domain =
		request.headers['x-forwarded-host'] || request.headers['x-meetup-host'];
	const host = `${requestProtocol}://${domain}`;

	const trackingParam = request.query._xtd;
	if (trackingParam) {
		return {
			'X-Meetup-External-Track': trackingParam,
			'X-Meetup-External-Track-Url': `${host}${request.url.href}`,
		};
	}
	return {};
}

export function parseRequestHeaders(request) {
	const requestOptsHeaders = {
		...request.headers,
		...getAuthHeaders(request),
		...getClientIpHeader(request),
		...getTrackingHeaders(request),
		'accept-language': getLanguageHeader(request),
		'x-meetup-agent': config.package.agent,
		'x-meetup-parent-request-id': request.id,
	};

	delete requestOptsHeaders['host']; // let app server set 'host'
	delete requestOptsHeaders['accept-encoding']; // let app server set 'accept'
	delete requestOptsHeaders['content-length']; // original request content-length is irrelevant
	delete requestOptsHeaders['content-type']; // the content type will be set in buildRequestArgs

	return requestOptsHeaders;
}

/*
 * In multipart form requests, the parsed payload includes string key-value
 * pairs for regular inputs, and raw Buffer objects for file uploads
 *
 * This function passes through regular input values unchanged, but formats the
 * file buffers into a { value, options } object that can be used in request
 * formData
 * @see https://www.npmjs.com/package/request#multipartform-data-multipart-form-uploads
 */
export const parseMultipart = payload =>
	Object.keys(payload).reduce((formData, key) => {
		const value = payload[key];
		formData[key] =
			value instanceof Buffer
				? { value, options: { filename: 'upload' } }
				: value;
		return formData;
	}, {});

/*
 * Translate the incoming Hapi request into an 'opts' object that can be used
 * to call `request` for the REST API. This function essentially translates the
 * app server request properties (headers, payload) into corresponding REST API
 * request properties. The resulting value will be used as the _base_ set of
 * options for _every_ parallel REST API request made by the platform
 * corresponding to single incoming request.
 *
 * @return {Object} requestOpts
 */
export function getRequestOpts(request) {
	const { api } = request.server.settings.app;
	const requestOpts = {
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
		requestOpts.formData = parseMultipart(request.payload);
	}
	return requestOpts;
}

/**
 * Fake an API request and directly return the stringified mockResponse
 */
export const makeMockRequest = (mockResponseContent, responseMeta) => requestOpts =>
	Promise.resolve([
		makeMockResponse(requestOpts, responseMeta),
		JSON.stringify(mockResponseContent),
	]);

/**
 * Make a real external API request, return response body string
 */
export const makeDoApiRequest = request => requestOpts => {
	return doRequest(requestOpts).catch(err => {
		request.server.app.logger.error({
			err,
			externalRequest: requestOpts, // for detailed debugging, including headers
			context: requestOpts, // for error report context
			...request.raw,
		});

		const errorObj = { errors: [err] };
		if (err.code === 'ETIMEDOUT') {
			return makeMockRequest(errorObj, API_TIMEOUT_RESPONSE)(requestOpts);
		}
		return makeMockRequest(errorObj, makeAPIErrorResponse(err))(requestOpts);
	});
};

/*
 * Make an API request and parse the response into the expected `response`
 * object shape
 */
export const makeSendQuery = request => {
	// 1. get the queries and the shared `requestOpts` from the request
	//    that will be applied to all queries
	const requestOpts = getRequestOpts(request);

	// 2. create a function that uses `requestOpts` as a base from which
	//    to build query-specific API request options objects
	const queryToRequestOpts = buildRequestArgs(requestOpts);

	return query => {
		const requestOpts = queryToRequestOpts(query);
		// decide whether to make a _real_ request or a mock request
		const doRequest = query.mockResponse
			? makeMockRequest(query.mockResponse)
			: makeDoApiRequest(request);

		return doRequest(requestOpts);
	};
};
