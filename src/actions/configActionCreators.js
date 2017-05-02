export function configureApiUrl(url) {
	return {
		type: 'CONFIGURE_API_URL',
		payload: url,
	};
}

export function configureBaseUrl(url) {
	return {
		type: 'CONFIGURE_BASE_URL',
		payload: url,
	};
}
