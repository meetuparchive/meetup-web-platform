export function configureUrls({ baseUrl, apiUrl }) {
	return {
		type: 'CONFIGURE_URLS',
		payload: { baseUrl, apiUrl }
	};
}

// export function configureBaseUrl(url) {
// 	console.log('-----------',url,'----------');
// 	return {
// 		type: 'CONFIGURE_BASE_URL',
// 		payload: url
// 	};
// }

