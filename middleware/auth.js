/**
 * Auth middle handles all the server communication and cookie managmenet
 * related to login actions.
 *
 * We assume that the login API provides *both* an auth token and the member
 * object corresponding to the login credentials
 *
 * @module AuthMiddleware
 */
import Cookies from 'js-cookie';
import { bindActionCreators } from 'redux';
import {
	logoutSuccess,
	logoutError,
	configureAuth,
} from '../actions/authActionCreators';

export const ANONYMOUS_AUTH_APP_PATH = '/anon';

/**
 * There are 6 login-related actions:
 *
 * 1. 'LOGIN_REQUEST' - send credentials for login
 * 2. 'LOGIN_SUCCESS' - updates local state/cookie from api response
 * 3. 'LOGIN_ERROR' - server failed to login user with supplied credentials
 * 4. 'LOGOUT_REQUEST' - return to default state and request anonymous
 *   auth token from server
 * 5. 'LOGOUT_SUCCESS' - new anonymous auth token returned
 * 6. 'LOGOUT_ERROR' - server failed to get anonymous auth token - fatal
 */
const AuthMiddleware = store => next => action => {
	const actions = bindActionCreators({
		logoutSuccess,
		logoutError,
		configureAuth,
	}, store.dispatch);
	let response;
	switch (action.type) {
	case 'LOGIN_SUCCESS':
		// parse the login API endpoint response and dispatch
		// configure auth action
		response = action.payload;
		actions.configureAuth(({
			oauth_token: response.value.oauth_token,  // currently does not expire
			expires_in: response.value.expires_in || 60 * 60,  // seconds
			refresh_token: response.value.refresh_token,
			anonymous: false,
		}));
		break;
	case 'LOGIN_ERROR':
		break;
	case 'LOGOUT_REQUEST':
		// immediately clear auth information so no more private data is accessible
		// - this will put the app in limbo, unable to request any more data until
		// a new token is provided by `LOGOUT_SUCESS` or a full refresh
		actions.configureAuth({
			anonymous: true
		});
		// Go get a new anonymous oauth token
		fetch(ANONYMOUS_AUTH_APP_PATH)
			.then(response => response.json())
			.catch(e => Promise.reject([e]))
			.then(actions.logoutSuccess, actions.logoutError);
		break;
	case 'LOGOUT_SUCCESS':
		// anonymous auth has returned new anon oauth token
		response = action.payload;
		// re-sync the page
		actions.configureAuth({
			anonymous: true,
			oauth_token: response.access_token,
			refresh_token: response.refresh_token,
			expires_in: response.expires_in,
		});
		break;
	case 'LOGOUT_ERROR':
		break;
	case 'CONFIGURE_AUTH':
		// The middleware sets cookies based on `configureAuth` actions, but only
		// in the browser. `action.meta` is a Boolean indicating whether the
		// action was dispatched from the server or the browser. If it's from the
		// server, we should not set cookies
		if (!action.meta) {
			const {
				oauth_token,
				expires_in,  // in seconds
				refresh_token,
				anonymous,
			} = action.payload;
			const expires = expires_in ? 1 / 24 / 3600 * expires_in : 365;  // lifetime in *days*

			Cookies.set(
				'oauth_token',
				oauth_token || '',
				{ expires }
			);
			Cookies.set(
				'refresh_token',
				refresh_token || '',
				{ expires: 5 * 365 }  // 5 year expiration - 'permanent'
			);
			Cookies.set(
				'anonymous',
				anonymous || '',
				{ expires: 5 * 365 }  // 'permanent', but refreshes with every login/logout
			);
		}
		break;
	}

	return next(action);
};

export default AuthMiddleware;

