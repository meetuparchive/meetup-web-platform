import cookie from 'cookie';
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
	const isDelete = method.toLowerCase() === 'delete';

	const fetchUrl = new URL(apiUrl);
	fetchUrl.searchParams.append('queries', JSON.stringify(queries));
	if (meta) {
		fetchUrl.searchParams.append('metadata', JSON.stringify(meta));
		if (meta.logout) {
			fetchUrl.searchParams.append('logout', true);
		}
	}
	const fetchConfig = {
		method,
		headers: {
			...(headers || {}),
			cookie: cleanBadCookies((headers || {}).cookie),
			'content-type': isPost ? 'application/x-www-form-urlencoded' : 'text/plain',
			'x-csrf-jwt': (isPost || isDelete) ? options.csrf : '',
		},
		credentials: 'same-origin'  // allow response to set-cookies
	};
	if (isPost) {
		// assume client side
		fetchConfig.body = fetchUrl.searchParams.toString();
	}
	return fetch(
		isPost ? apiUrl : fetchUrl.toString(),
		fetchConfig
	)
	.then(queryResponse =>
		queryResponse.json().then(({ responses, error, message }) => {
			if (error) {
				throw new Error(message);  // treat like an API error
			}
			return {
				queries,
				responses: responses || [],
				csrf: queryResponse.headers.get('x-csrf-jwt'),
			};
		}),
		err => {
			console.error(JSON.stringify({
				err: err.stack,
				message: 'App server API fetch error',
				context: fetchConfig,
			}));
			throw err;
		}
	);
};

/**
 * Attempt to JSON parse a Response object from a fetch call
 *
 * @param {String} reqUrl the URL that was requested
 * @param {Response} response the fetch Response object
 * @return {Promise} a Promise that resolves with the JSON-parsed text
 */
export const tryJSON = reqUrl => response => {
	const { status, statusText } = response;
	if (status >= 400) {  // status always 200: bugzilla #52128
		return Promise.reject(
			new Error(`Request to ${reqUrl} responded with error code ${status}: ${statusText}`)
		);
	}
	return response.text().then(text => JSON.parse(text));
};

/**
 * Convert an object of cookie name-value pairs into a 'Cookie' header. This
 * is different than the serialization offered by the 'cookie' and
 * 'tough-cookie' packages, which write cookie values in the form of a
 * 'Set-Cookie' header, which contains more info
 *
 * @param {Object} cookies a name-value mapping of cookies, e.g. from
 *   `cookie.parse`
 * @return {String} a 'Cookie' header string
 */
export const stringifyCookies = cookies =>
	Object.keys(cookies)
		.map(name => `${name}=${cookies[name]}`)
		.join('; ');

/**
 * @param {String} rawCookieHeader a 'cookie' header string
 * @param {Object} newCookies an object of name-value cookies to inject
 */
export const mergeCookies = (rawCookieHeader, newCookies) => {
	// request.state has _parsed_ cookies, but we need to send raw cookies
	// _except_ when the incoming request has been back-populated with new 'raw' cookies
	const oldCookies = cookie.parse(rawCookieHeader);
	const mergedCookies = {
		...oldCookies,
		...newCookies,
	};
	return stringifyCookies(mergedCookies);
};

export const BAD_COOKIES = [
	'click-track'
];

/**
 * Remove cookies that are known to have values that are invalid for `fetch`
 * calls
 *
 * @param {String} cookieHeader a cookie header
 * @return {String} a cleaned cookie header string
 */
export const cleanBadCookies = (cookieHeader) => {
	if (!cookieHeader) {
		return '';
	}
	const cookies = cookie.parse(cookieHeader);
	BAD_COOKIES.forEach(badCookie => delete cookies[badCookie]);

	return stringifyCookies(cookies);
};

