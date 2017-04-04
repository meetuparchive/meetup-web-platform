export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

export function apiRequest(queries, meta) {
	return {
		type: 'API_REQUEST',
		payload: queries,
		meta,
	};
}

export function apiSuccess({ query, response }) {
	return {
		type: 'API_SUCCESS',
		payload: { query, response },
	};
}

export function apiError(err) {
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

export function apiFailure(error) {
	return {
		type: 'API_FAILURE',
		payload: error,
	};
}

export function locationChange(location) {
	return {
		type: LOCATION_CHANGE,
		payload: location
	};
}

