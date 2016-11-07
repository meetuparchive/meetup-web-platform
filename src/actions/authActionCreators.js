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
				// otherwise return the action
				return loginSuccess(response);
			},
			onError: loginError
		}
	};
}

export function configureAuth(auth, suppressSync) {
	return {
		type: 'CONFIGURE_AUTH',
		payload: auth,
		meta: suppressSync
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

export function logoutRequest() {
	return {
		type: 'LOGOUT_REQUEST'
	};
}

export function logoutSuccess(auth) {
	return {
		type: 'LOGOUT_SUCCESS',
		payload: auth,
	};
}

export function logoutError(err) {
	return {
		type: 'LOGOUT_ERROR',
		error: true,
		payload: err
	};
}

