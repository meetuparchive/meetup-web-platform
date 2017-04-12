export function cacheSet({ query, response }) {
	return {
		type: 'CACHE_SET',
		payload: { query, response },
	};
}

export function cacheRequest(queries) {
	return {
		type: 'CACHE_REQUEST',
		payload: queries
	};
}

export function cacheSuccess({ query, response }) {
	return {
		type: 'CACHE_SUCCESS',
		payload: { query, response }
	};
}

export function cacheClear() {
	return {
		type: 'CACHE_CLEAR',
	};
}

