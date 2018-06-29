import querystring from 'qs';
import { logger } from 'mwp-logger-plugin';

import { API_PROXY_PLUGIN_NAME } from '../config';
import { coerceBool, toCamelCase } from './stringUtils';

// match escpaed unicode characters that are treated as newline literals in JS
const ESCAPED_UNICODE_NEWLINES = /\\u2028|\\u2029/g;

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
	variantsHeader.split(' ').reduce((variants, keyval) => {
		const [experiment, val] = keyval.split('=');
		variants[experiment] = variants[experiment] || {};
		const [context, variant] = val.split('|');
		variants[experiment][context] = variant || null;
		return variants;
	}, {});

const X_HEADERS = ['x-total-count'];

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
			delimiter: ', ',
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

	const linkHeader =
		headers.link &&
		headers.link.split(',').reduce((links, link) => {
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
 * @param {Error} err the error to populate
 * @return {Object} { value, error? }
 */
function formatApiError(err, value = null) {
	return {
		value,
		error: err.message,
	};
}

const parseBody = body => {
	if (!body) {
		return null;
	}
	// Some newline literals will not work in JS string literals - they must be
	// converted to an escaped newline character that will work end to end ('\n')
	// treat non-success HTTP code as an error
	const safeBody = body.replace(ESCAPED_UNICODE_NEWLINES, '\\n');
	return JSON.parse(safeBody);
};

/**
 * The externalRequest callback provides a `response` object and a `body` string
 * that need to be parsed in order to determine the appropriate 'value'.
 *
 * This function determines the { value, error } based on the status code and
 * body of the response - it will always set an 'error' value when a non-2xx
 * response is received, but it may provide additional error details that are
 * included in the 'body' of the response - body error details will usually
 * be JSON parsed into `value.errors`, but that is determined by the JSON
 * returned by the REST API.
 *
 * @return {Object} { value, error? }
 */
export const parseApiValue = ([response, body]) => {
	if (response.statusCode === 204) {
		// NoContent response type
		return { value: null };
	}

	try {
		const value = parseBody(body);
		if (response.statusCode < 200 || response.statusCode >= 400) {
			return formatApiError(new Error(response.statusMessage), value);
		}
		if (value && value.problem) {
			return formatApiError(
				new Error(`API problem: ${value.problem}: ${value.details}`),
				value
			);
		}
		return { value };
	} catch (err) {
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
export const makeParseApiResponse = query => ([response, body]) => {
	const { value, error } = parseApiValue([response, body]);
	const meta = {
		...parseMetaHeaders(response.headers),
		endpoint: query.endpoint,
		statusCode: response.statusCode,
	};

	return {
		value,
		error,
		meta,
	};
};
/**
 * Format apiResponse to match expected state structure
 *
 * @param {Object} apiResponse JSON-parsed api response data
 */
export const makeApiResponseToQueryResponse = query => ({
	value,
	error,
	meta,
}) => ({
	type: query.type,
	ref: query.ref,
	value,
	error,
	meta,
});

export const makeLogResponse = request => ([response, body]) => {
	const {
		request: { headers, method, uri: { href: url } },
		statusCode,
	} = response;
	const logBase = {
		...request.raw, // request to API_ROUTE_PATH
		externalRequest: { headers, method, url }, // request to https://api.meetup.com/
	};

	if (
		statusCode >= 500 || // REST API had an internal error
		(method.toLowerCase() === 'get' && statusCode >= 400) // something fishy with a GET
	) {
		const logError = (statusCode < 500 ? logger.warn : logger.error).bind(
			logger
		);
		let errorMessage;
		try {
			// well-behaved API errors return a JSON object with an `errors` array
			const info = JSON.parse(body);
			errorMessage = JSON.stringify(info.errors[0]) || body;
		} catch (err) {
			// probably not JSON, could be an HTML response
			const titleContent = /<title>(.+?)<\/title>/.exec(body);
			errorMessage = titleContent ? titleContent[1] : 'REST API error';
		}
		logError({
			...logBase,
			body: body.length > 512 ? `${body.substr(0, 512)}...` : body,
			err: new Error(errorMessage),
			context: response, // this will provide limited info - check apiRequest for more detail
		});
		return;
	}
	// not an error response - log in dev, not prod
	if (process.env.NODE_ENV !== 'production') {
		logger.info({
			...logBase,
			httpRequest: response,
		});
	}
};

/**
 * When a tough-cookie cookie jar is provided, forward the cookies along with
 * the overall /api response back to the client
 */
export const makeInjectResponseCookies = request => ([response, _, jar]) => {
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
			isSecure: request.server.settings.app.isProd,
			strictHeader: false, // Can't enforce RFC 6265 cookie validation on external services
		};

		request.plugins[API_PROXY_PLUGIN_NAME].setState(
			cookie.key,
			cookie.value,
			cookieOptions
		);
	});
};

export const makeReceive = request => {
	const logResponse = makeLogResponse(request);
	const injectResponseCookies = makeInjectResponseCookies(request);
	return query => {
		const parseApiResponse = makeParseApiResponse(query);
		const apiResponseToQueryResponse = makeApiResponseToQueryResponse(query);
		return response => {
			logResponse(response); // this will leak private API response data into production logs
			injectResponseCookies(response);
			try {
				return apiResponseToQueryResponse(parseApiResponse(response));
			} catch (err) {
				return {
					...formatApiError(err),
					meta: {
						endpoint: query.endpoint,
					},
				};
			}
		};
	};
};
