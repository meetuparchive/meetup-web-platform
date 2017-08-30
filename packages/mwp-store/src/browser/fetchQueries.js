import JSCookie from 'js-cookie';
import rison from 'rison';
import { setClickCookie } from '../../plugins/tracking/util/clickState'; // mwp-tracking-plugin

import { parseQueryResponse } from '../util/fetchUtils';

export const CSRF_HEADER = 'x-csrf-jwt';
export const CSRF_HEADER_COOKIE = 'x-csrf-jwt-header';

/**
 * that the request will have the required OAuth and CSRF credentials and constructs
 * the `fetch` call arguments based on the request method. It also records the
 * CSRF header value in a cookie for use as a CSRF header in future fetches.
 *
 * @param {String} apiUrl the general-purpose endpoint for API calls to the
 *   application server
 * @param {Array} queries the queries to send - must all use the same `method`
 * @param {Object} meta additional characteristics of the request, e.g.
 *   click tracking data
 * @return {Object} { url, config } arguments for a fetch call
 */
export const getFetchArgs = (apiUrl, queries, meta) => {
	const headers = {};
	const method = ((queries[0].meta || {}).method || 'GET') // fallback to 'get'
		.toUpperCase(); // must be upper case - requests can fail silently otherwise

	const hasBody = method === 'POST' || method === 'PATCH';
	const isFormData = queries[0].params instanceof FormData;
	const isDelete = method === 'DELETE';

	const searchParams = new URLSearchParams();
	searchParams.append('queries', rison.encode_array(queries));

	if (meta) {
		const {
			clickTracking,
			onSuccess, // eslint-disable-line no-unused-vars
			onError, // eslint-disable-line no-unused-vars
			...metadata
		} = meta;

		if (clickTracking) {
			setClickCookie(clickTracking);
		}

		// send other metadata in searchParams
		const encodedMetadata = metadata && rison.encode_object(metadata);
		if (encodedMetadata) {
			// send other metadata in searchParams
			searchParams.append('metadata', encodedMetadata);
		}
	}

	if (!isFormData) {
		// need to manually specify content-type for any non-multipart request
		headers['content-type'] = hasBody
			? 'application/x-www-form-urlencoded'
			: 'application/json';
	}

	if (hasBody || isDelete) {
		headers[CSRF_HEADER] = JSCookie.get(CSRF_HEADER_COOKIE);
	}

	const config = {
		method,
		headers,
		credentials: 'same-origin', // allow response to set-cookies
	};
	if (hasBody) {
		config.body = isFormData ? queries[0].params : searchParams.toString();
	}
	const useQueryString = isFormData || !hasBody;
	const url = useQueryString ? `${apiUrl}?${searchParams}` : apiUrl;
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
 * @param {Object} meta additional characteristics of the request, e.g.
 *   click tracking data
 * @return {Promise} resolves with a `{queries, responses}` object
 */
const fetchQueries = apiUrl => (queries, meta) => {
	if (
		typeof window === 'undefined' &&
		typeof test === 'undefined' // not in browser // not in testing env (global set by Jest)
	) {
		throw new Error('fetchQueries was called on server - cannot continue');
	}

	const { url, config } = getFetchArgs(apiUrl, queries, meta);

	return fetch(url, config)
		.then(queryResponse => queryResponse.json())
		.then(queryJSON => ({
			...parseQueryResponse(queries)(queryJSON),
		}))
		.catch(err => {
			console.error(
				JSON.stringify({
					err: err.stack,
					message: 'App server API fetch error',
					context: config,
				})
			);
			throw err; // handle the error upstream
		});
};

export default fetchQueries;
