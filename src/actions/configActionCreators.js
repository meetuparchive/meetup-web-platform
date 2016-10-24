export function configureApiUrl(url) {
	return {
		type: 'CONFIGURE_API_URL',
		payload: url
	};
}

export function configureTrackingId(id) {
	return {
		type: 'CONFIGURE_TRACKING_ID',
		payload: id
	};
}
