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

