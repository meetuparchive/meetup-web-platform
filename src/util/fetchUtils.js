import JSCookie from 'js-cookie';
import rison from 'rison';


const BrowserCookies = JSCookie.withConverter({
	read: (value, name) => value,
	write: (value, name) =>
		encodeURIComponent(value)
			.replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`),
});

/**
 * A module for middleware that would like to make external calls through `fetch`
 * @module fetchUtils
 */

export const CSRF_HEADER = 'x-csrf-jwt';
export const CSRF_HEADER_COOKIE = 'x-csrf-jwt-header';

export const parseQueryResponse = queries => ({ responses, error, message }) => {
	if (error) {
		throw new Error(JSON.stringify({ error, message }));  // treat like an API error
	}
	return {
		queries,
		responses: responses || [],
	};
};

/**
 * that the request will have the required OAuth and CSRF credentials and constructs
 * the `fetch` call arguments based on the request method. It also records the
 * CSRF header value in a cookie for use as a CSRF header in future fetches.
 *
 * @param {String} apiUrl the general-purpose endpoint for API calls to the
 *   application server
 * @param {Array} queries the queries to send - must all use the same `method`
 * @param {Object} meta additional characteristics of the request, e.g. logout,
 *   click tracking data
 * @return {Object} { url, config } arguments for a fetch call
 */
export const getFetchArgs = (apiUrl, queries, meta) => {
	const headers = {};
	const method = (
		(queries[0].meta || {}).method ||
			'GET'  // fallback to 'get'
	).toUpperCase();  // must be upper case - requests can fail silently otherwise

	const hasBody = method === 'POST' ||
		method === 'PATCH';
	const isFormData = queries[0].params instanceof FormData;
	const isDelete = method === 'DELETE';

	const fetchUrl = new URL(apiUrl);
	fetchUrl.searchParams.append('queries', rison.encode_array(queries));

	if (meta) {
		const {
			clickTracking,
			logout,
			...metadata
		} = meta;

		if (clickTracking) {
			BrowserCookies.set(
				'click-track',
				JSON.stringify(clickTracking),
				{ domain: apiUrl.indexOf('.dev.') > -1 ? '.dev.meetup.com' : '.meetup.com' }
			);
		}

		// special logout param
		if (logout) {
			fetchUrl.searchParams.append('logout', true);
		}

		// send other metadata in searchParams
		if (Object.keys(metadata).length) {
			// send other metadata in searchParams
			fetchUrl.searchParams.append('metadata', rison.encode_object(metadata));
		}
	}

	if (!isFormData) {
		// need to manually specify content-type for any non-multipart request
		headers['content-type'] = hasBody ?
			'application/x-www-form-urlencoded' :
			'application/json';
	}

	if (hasBody || isDelete) {
		headers[CSRF_HEADER] = BrowserCookies.get(CSRF_HEADER_COOKIE);
	}

	const config = {
		method,
		headers,
		credentials: 'same-origin'  // allow response to set-cookies
	};
	if (hasBody) {
		config.body = isFormData ?
			queries[0].params :
			fetchUrl.searchParams.toString();
	}
	const url = isFormData || !hasBody ? fetchUrl.toString() : apiUrl;
	return {
		url,
		config,
	};
};

/**
 * Wrapper around `fetch` to send an array of queries to the server and organize
 * the responses.
*
 * **IMPORTANT**: This function should _only_ be called from the browser. The
 * server should never need to call itself over HTTP
 *
 * @param {String} apiUrl the general-purpose endpoint for API calls to the
 *   application server
 * @param {Array} queries the queries to send - must all use the same `method`
 * @param {Object} meta additional characteristics of the request, e.g. logout,
 *   click tracking data
 * @return {Promise} resolves with a `{queries, responses}` object
 */
export const fetchQueries = (apiUrl) => (queries, meta) => {
	if (
		typeof window === 'undefined' &&  // not in browser
		typeof test === 'undefined'  // not in testing env (global set by Jest)
	) {
		throw new Error('fetchQueries was called on server - cannot continue');
	}

	const {
		url,
		config,
	} = getFetchArgs(apiUrl, queries, meta);

	return fetch(url, config)
		.then(queryResponse => queryResponse.json())
		.then(queryJSON => ({
			...parseQueryResponse(queries)(queryJSON),
		}))
		.catch(err => {
			console.error(JSON.stringify({
				err: err.stack,
				message: 'App server API fetch error',
				context: config,
			}));
			throw err;  // handle the error upstream
		});
};

/**
 * Attempt to JSON parse a Response object from a fetch call
 *
 * @param {String} reqUrl the URL that was requested
 * @param {Response} response the fetch Response object
 * @return {Promise} a Promise that resolves with the JSON-parsed text
 */
export const tryJSON = reqUrl => response => {
	const { status, statusText } = response;
	if (status >= 400) {  // status always 200: bugzilla #52128
		return Promise.reject(
			new Error(`Request to ${reqUrl} responded with error code ${status}: ${statusText}`)
		);
	}
	return response.text().then(text => JSON.parse(text));
};

