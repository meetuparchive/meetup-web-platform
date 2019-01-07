/**
 * @deprecated
 */
export function apiRequest(queries, meta) {
	return {
		type: 'API_REQUEST',
		payload: queries,
		meta,
	};
}

/**
 * @deprecated
 */
export function apiSuccess({ queries, responses }) {
	return {
		type: 'API_SUCCESS',
		payload: { queries, responses },
	};
}

/**
 * @deprecated
 */
export function apiError(err) {
	return {
		type: 'API_ERROR',
		payload: err,
	};
}

/**
 * @deprecated
 */
export function apiComplete() {
	return {
		type: 'API_COMPLETE',
	};
}
