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
type RequestMeta = {
	request?: Promise<Array<QueryResponse>>,
	reject?: any => void,
	resolve?: (Array<QueryResponse>) => void,
	[string]: string,
};
function _requestAll(queries: Array<Query>, meta: ?RequestMeta) {
	if (process.env.NODE_ENV !== 'production') {
		// check queries have valid 'meta.method' value
		const method = queries[0].meta && queries[0].meta.method;
		queries.forEach(q => {
			if (!q.meta || !q.meta.method || q.meta.method !== method) {
				// meta.method must be set and must be the same for all queries
				console.error(
					'_requestAll should not be called directly',
					'use a method-specific API request action creator'
				);
			}
		});
	}
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

const setMethod = method => (q: Query) => {
	if (process.env.NODE_ENV !== 'production') {
		// just some dev debug niceties that will be stripped out in prod
		const methodValue = (q.meta || {}).method;
		if (methodValue) {
			console.error(JSON.stringify(q));
			console.error('Query objects should not specify a `meta.method`');
			if (methodValue !== method) {
				throw new TypeError(
					'query.meta.method does not match API action creator method'
				);
			}
		}
	}
	return {
		...q,
		meta: { ...(q.meta || {}), method },
	};
};
const _applyMethod = method => (query: Query | Array<Query>, meta: ?Object) => {
	const queries = query instanceof Array ? query : [query];
	// delegate to `_requestAll`
	return _requestAll(queries.map(setMethod(method)), meta);
};

export const get = _applyMethod('get');
export const post = _applyMethod('post');
export const patch = _applyMethod('patch');
export const put = _applyMethod('put');
export const del = _applyMethod('delete');
export const track = (query: Query, meta: ?Object) => {
	meta = meta || {};
	query.endpoint = 'track';
	meta.clickTracking = true;
	return post(query, meta);
};

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
