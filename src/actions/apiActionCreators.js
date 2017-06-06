// @flow
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
 * All request actions will get a Promise object injected into the `meta`
 * property, along with `resolve` and `reject` methods that can be used to
 * programmatically resolve the Promise. The expectation is that this Promise
 * will be used to indicate the state of the request, and will resolve when the
 * request is resolved or rejected.
 *
 * @param {Array} queries the queries to send to the server
 * @param {Object} meta metadata about the request, e.g. 'logout', 'clickTracking'
 * @return {Object} an API_REQ action
 */
export function requestAll(queries: Array<Query>, meta: ?Object) {
	meta = meta || {};
	meta.request = new Promise((resolve, reject) => {
		meta = meta || {};
		meta.resolve = resolve;
		meta.reject = reject;
	});
	return {
		type: API_REQ,
		payload: queries,
		meta,
	};
}

const _applyMethod = method => (query: Query, meta: ?Object) => {
	query.meta = {
		...(query.meta || {}),
		method,
	};
	// delegate to `requestAll`
	const requestAction = requestAll([query], meta);
	// modify the promise to automatically pull out the single response
	// corresponding to the single query
	requestAction.meta.promise = requestAction.meta.request.then(
		responses => responses[0]
	);
	return requestAction;
};

export const get = _applyMethod('get');
export const post = _applyMethod('post');
export const patch = _applyMethod('patch');
export const del = _applyMethod('delete');

type ResponseAction = {
	query: Query,
	response: QueryResponse,
};
export function success({ query, response }: ResponseAction) {
	return {
		type: API_RESP_SUCCESS,
		payload: { query, response },
	};
}

export function error({ query, response }: ResponseAction) {
	return {
		type: API_RESP_ERROR,
		payload: { query, response },
	};
}

export function fail(err: Error) {
	return {
		type: API_RESP_FAIL,
		payload: err,
	};
}

export function complete(queries: Array<Query>) {
	return {
		type: API_RESP_COMPLETE,
		payload: queries,
	};
}
