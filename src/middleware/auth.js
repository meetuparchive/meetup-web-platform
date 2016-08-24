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
import Rx from 'rx';
import { bindActionCreators } from 'redux';
import {
	logoutSuccess,
	logoutError,
	configureAuth,
} from '../actions/authActionCreators';

/**
 * login sub responds to only the most recent login request, and can be disposed
 * by a logout
 * @const
 */
const loginSub = new Rx.SerialDisposable();
loginSub.setDisposable(Rx.Disposable.empty);

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
	}, store.dispatch);

	let oauth_token,
		response;
	switch (action.type) {
	case 'LOGIN_SUCCESS':
		response = action.payload;
		oauth_token = response.value.oauth_token;
		Cookies.set('oauth_token', oauth_token);
		Cookies.remove('anonymous');
		// re-sync the page
		store.dispatch(configureAuth(({ oauth_token })));
		break;
	case 'LOGIN_ERROR':
		break;
	case 'LOGOUT_REQUEST':
		Cookies.remove('oauth_token');
		fetch('/anon')  // application server route to serve anonymous tokens
			.then(response => response.json())
			.catch(e => Promise.reject([e]))
			.then(actions.logoutSuccess, actions.logoutError);
		break;
	case 'LOGOUT_SUCCESS':
		response = action.payload;
		oauth_token = response.access_token;
		Cookies.set('oauth_token', oauth_token);
		Cookies.set('anonymous', true);
		// re-sync the page
		store.dispatch(configureAuth(({ anonymous: true, oauth_token })));
		break;
	case 'LOGOUT_ERROR':
		break;
	}
	return next(action);
};

export default AuthMiddleware;

