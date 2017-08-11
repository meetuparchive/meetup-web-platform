export const CACHE_SET = 'CACHE_SET';
export const CACHE_REQUEST = 'CACHE_REQUEST';
export const CACHE_SUCCESS = 'CACHE_SUCCESS';
export const CACHE_CLEAR = 'CACHE_CLEAR';

export function cacheSet({ query, response }) {
	return {
		type: CACHE_SET,
		payload: { query, response },
	};
}

export function cacheRequest(queries) {
	return {
		type: CACHE_REQUEST,
		payload: queries,
	};
}

export function cacheSuccess({ query, response }) {
	return {
		type: CACHE_SUCCESS,
		payload: { query, response },
	};
}

export function cacheClear() {
	return {
		type: CACHE_CLEAR,
	};
}
