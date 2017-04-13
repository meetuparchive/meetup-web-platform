export const API_REQ = 'API_REQ';
export const API_RESP_SUCCESS = 'API_RESP_SUCCESS';
export const API_RESP_COMPLETE = 'API_RESP_COMPLETE';
export const API_RESP_ERROR = 'API_RESP_ERROR';
export const API_RESP_FAIL = 'API_RESP_FAIL';

/**
 * Generic base action creator upon which all individual query action creators
 * are built. This action creator is designed to support parallel queries with
 * request metadata, which primarily appears in navigation-related actions.
 *
 * @param {Array} queries the queries to send to the server
 * @param {Object} meta metadata about the request, e.g. 'logout', 'clickTracking'
 * @return {Object} an API_REQ action
 */
export function requestAll(queries, meta) {
	return {
		type: API_REQ,
		payload: queries,
		meta,
	};
}

export const _applyMethod = method => query => {
	query.meta = {
		...(query.meta || {}),
		method: 'post',
	};
	return requestAll([query]);
};

export const get = _applyMethod('get');
export const post = _applyMethod('post');
export const patch = _applyMethod('patch');
export const del = _applyMethod('delete');

export function success({ query, response }) {
	return {
		type: API_RESP_SUCCESS,
		payload: { query, response },
	};
}

export function error({ query, response }) {
	return {
		type: API_RESP_ERROR,
		payload: { query, response },
	};
}

export function fail(err) {
	return {
		type: API_RESP_FAIL,
		payload: err,
	};
}

export function complete() {
	return {
		type: API_RESP_COMPLETE,
	};
}

