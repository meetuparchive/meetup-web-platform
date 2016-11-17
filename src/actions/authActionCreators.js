import { locationSync } from './syncActionCreators';
/**
 * @module authActionCreators
 */

/**
 * Create a 'POST' action with onSuccess that parses the API response and
 * returns either a loginError action (API successfully returned, but the
 * response indicates login failure) or a loginSuccess action. onError always
 * returns a loginError action
 * @param {Object} params object with 'email' and 'password' props
 */
export function loginPost(params) {
	const LOGIN_REF = 'login';
	return {
		type: 'LOGIN_POST',
		payload: {
			query: {
				type: 'login',
				params,
				ref: LOGIN_REF,
			},
			onSuccess: ({ queries, responses }) => {
				// get the response `value`
				const { [LOGIN_REF]: response } = responses.slice()[0];
				// check for errors reported by API (will be handled by loginError)
				if (response.value.errors) {
					return loginError(response.value.errors);
				}
				return locationSync();
			},
			onError: loginError
		}
	};
}

export function loginSuccess(response) {
	return {
		type: 'LOGIN_SUCCESS',
		payload: response,
	};
}

export function loginError(response) {
	return {
		type: 'LOGIN_ERROR',
		payload: response,
	};
}

