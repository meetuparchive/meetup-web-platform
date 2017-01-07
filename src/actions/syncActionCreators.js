export function apiRequest(queries, meta) {
	return {
		type: 'API_REQUEST',
		payload: queries,
		meta,
	};
}

export function apiSuccess({ queries, responses, csrf }) {
	return {
		type: 'API_SUCCESS',
		payload: { queries, responses },
		meta: {
			csrf,
		},
	};
}

export function apiError(err) {
	console.error('API_ERROR: ', err.stack);
	return {
		type: 'API_ERROR',
		payload: err,
	};
}

export function apiComplete() {
	return {
		type: 'API_COMPLETE'
	};
}

/**
 * A simple signal to indicate that the app should re-sync data with the
 * current router location. Usually used for authorization changes
 */
export function locationSync() {
	return { type: 'LOCATION_SYNC' };
}

