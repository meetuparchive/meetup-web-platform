import JSCookie from 'js-cookie';
import rison from 'rison';

import { parseQueryResponse, getAuthedQueryFilter } from '../util/fetchUtils';

export const CSRF_COOKIE_NAME =
	process.env.NODE_ENV === 'production' ? 'x-mwp-csrf' : 'x-mwp-csrf_dev';
export const CSRF_HEADER_COOKIE_NAME = `${CSRF_COOKIE_NAME}-header`;

/*
 * rison serialization fails for unserializable data, including params with
 * `undefined` values. This if/else will log an error in the browser in dev
 * in order to catch mistakes, and force-clean the data in prod to avoid
 * client app crashes. In many cases, `undefined` params will not result in
 * invalid return values, but they should be cleaned up to avoid uncertainty
 *
 * This if/else will be simplified to only contain the correct block in the
 * production bundle
 */
const makeSerializable = queries => {
	if (process.env.NODE_ENV === 'production') {
		// quick-and-cheap object cleanup for serialization. This will remove
		// undefined and unserializable values (e.g. functions)
		return JSON.parse(JSON.stringify(queries));
	} else {
		if (
			queries.length > 1 &&
			queries.some(({ params }) => params instanceof FormData)
		) {
			throw new Error(
				'POST queries with FormData cannot be batched',
				'- dispatch each one individually'
			);
		}
		try {
			rison.encode_array(queries);
		} catch (err) {
			console.error(err);
			console.error(
				'Problem encoding queries',
				'- please ensure that there are no undefined params',
				JSON.stringify(queries, null, 2)
			);
		}
	}
	return queries;
};

/**
 * Build the arguments for the `fetch` call to the app server that will
 * contain the batched queries
 *
 * @param {String} apiUrl the general-purpose endpoint for API calls to the
 *   application server
 * @param {Array} queries the queries to send - must all use the same `method`
 * @param {Object} meta additional characteristics of the request, e.g.
 *   click tracking data
 * @return {Object} { url, config } arguments for a fetch call
 */
export const getFetchArgs = (apiUrl, queries, meta, activityInfo) => {
	const headers = {};
	const method = ((queries[0].meta || {}).method || 'GET') // fallback to 'get'
		.toUpperCase(); // must be upper case - requests can fail silently otherwise

	const hasBody = method === 'POST' || method === 'PATCH' || method === 'PUT';
	const isFormData = queries[0].params instanceof FormData;
	const isDelete = method === 'DELETE';

	const pageSearchParams = new URLSearchParams(window.location.search);
	const searchParams = new URLSearchParams();
	searchParams.append('queries', rison.encode_array(makeSerializable(queries)));
	if (pageSearchParams.has('__set_geoip')) {
		searchParams.append('__set_geoip', pageSearchParams.get('__set_geoip'));
	}

	if (meta) {
		const {
			onSuccess, // eslint-disable-line no-unused-vars
			onError, // eslint-disable-line no-unused-vars
			promise, // eslint-disable-line no-unused-vars
			request, // eslint-disable-line no-unused-vars
			...metadata
		} = meta;

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
		headers[CSRF_COOKIE_NAME] = JSCookie.get(CSRF_HEADER_COOKIE_NAME);
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

const _fetchQueryResponse = ({ apiUrl, queries, meta, activityInfo }) => {
	if (queries.length === 0) {
		// no queries => no responses (no need to fetch)
		return Promise.resolve({ responses: [] });
	}

	const { url, config } = getFetchArgs(apiUrl, queries, meta, activityInfo);
	return fetch(url, config)
		.catch(err => {
			console.error(err);
			console.error('App server API fetch error');
			throw err; // handle the error upstream
		})
		.then(queryResponse =>
			queryResponse.json().catch(err => {
				console.error(err);
				console.error('App server API response JSON error');
				throw err; // handle the error upstream
			})
		);
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
const fetchQueries = (apiUrl, member) => (queries, meta, activityInfo) => {
	if (
		typeof window === 'undefined' &&
		typeof test === 'undefined' // not in browser // not in testing env (global set by Jest)
	) {
		throw new Error('fetchQueries was called on server - cannot continue');
	}

	const authedQueries = getAuthedQueryFilter(member);
	const validQueries = queries.filter(authedQueries);
	return _fetchQueryResponse({
		apiUrl,
		queries: validQueries,
		meta,
		activityInfo,
	}).then(queryResponse => ({
		...parseQueryResponse(validQueries)(queryResponse),
	}));
};

export default fetchQueries;
