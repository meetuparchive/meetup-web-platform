export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';
export const SERVER_RENDER = '@@server/RENDER';

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
		type: 'API_COMPLETE'
	};
}

export function locationChange(location) {
	return {
		type: LOCATION_CHANGE,
		payload: location
	};
}

