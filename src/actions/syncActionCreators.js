export function apiRequest(queries) {
	return {
		type: 'API_REQUEST',
		payload: queries,
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
	console.error(err.message);
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

