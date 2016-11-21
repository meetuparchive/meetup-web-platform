/**
 * A module for middleware that would like to make external calls through `fetch`
 * @module fetchUtils
 */

/**
 * Wrapper around `fetch` to send an array of queries to the server. It ensures
 * that the request will have the required Oauth access token and constructs
 * the `fetch` call arguments based on the request method
 * @param {String} apiUrl the general-purpose endpoint for API calls to the
 *   application server
 * @param {Object} options {
 *     method: "get", "post", "delete", or "patch",
 *   }
 * @return {Promise} resolves with a `{queries, responses}` object
 */
export const fetchQueries = (apiUrl, options) => (queries, meta) => {
	options.method = options.method || 'GET';
	const {
		method,
		headers,
	} = options;

	const isPost = method.toLowerCase() === 'post';

	const params = new URLSearchParams();
	params.append('queries', JSON.stringify(queries));
	params.append('metadata', JSON.stringify(meta));
	if (meta.logout) {
		params.append('logout', true);
	}
	const searchString = `?${params}`;
	const fetchUrl = `${apiUrl}${isPost ? '' : searchString}`;
	const fetchConfig = {
		method,
		headers: {
			...(headers || {}),
			'content-type': isPost ? 'application/x-www-form-urlencoded' : 'text/plain',
			'x-csrf-jwt': isPost ? options.csrf : '',
		},
		credentials: 'same-origin'  // allow response to set-cookies
	};
	if (isPost) {
		// assume client side
		fetchConfig.body = params;
	}
	return fetch(
		fetchUrl,
		fetchConfig
	)
	.then(queryResponse =>
		queryResponse.json().then(responses =>
			({
				queries,
				responses,
				csrf: queryResponse.headers.get('x-csrf-jwt'),
			})
		)
	);
};

export const tryJSON = reqUrl => response => {
	const { status, statusText } = response;
	if (status >= 400) {  // status always 200: bugzilla #52128
		throw new Error(`Request to ${reqUrl} responded with error code ${status}: ${statusText}`);
	}
	return response.text().then(text => JSON.parse(text));
};

export const makeCookieHeader = cookieObj =>
	Object.keys(cookieObj)
		.map(name => `${name}=${cookieObj[name]}`)
		.join('; ');

