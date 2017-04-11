export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

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
export function apiSuccess({ query, response }) {
	return {
		type: 'API_SUCCESS',
		payload: { query, response },
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
		type: 'API_COMPLETE'
	};
}

export function locationChange(location) {
	return {
		type: LOCATION_CHANGE,
		payload: location
	};
}

