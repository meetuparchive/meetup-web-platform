/**
 * Auth middle handles all the server communication and cookie managmenet
 * related to login actions.
 *
 * We assume that the login API provides *both* an auth token and the member
 * object corresponding to the login credentials
 *
 * @module AuthMiddleware
 */
import Rx from 'rxjs';
import { combineEpics } from 'redux-observable';
import Cookies from 'js-cookie';

import {
	logoutSuccess,
	logoutError,
	configureAuth,
} from '../actions/authActionCreators';

export const AUTH_ENDPOINT = '/auth';

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

export const handleLoginSuccess = action$ =>
	action$.ofType('LOGIN_SUCCESS')
		.map(({ payload }) =>
			configureAuth({
				oauth_token: payload.value.oauth_token,  // currently does not expire
				expires_in: payload.value.expires_in || 60 * 60,  // seconds
				refresh_token: payload.value.refresh_token,
			})
		);

export const handleLogoutRequest = action$ =>
	action$.ofType('LOGOUT_REQUEST')
		.flatMap(action =>
			Rx.Observable.merge(
				// immediately clear auth information so no more private data is accessible
				// - this will put the app in limbo, unable to request any more data until
				// a new token is provided by `LOGOUT_SUCESS` or a full refresh
				Rx.Observable.of(configureAuth({})),  // clear all auth info
				Rx.Observable.fromPromise(
					fetch(AUTH_ENDPOINT, { credentials: 'same-origin' })  // response will set cookies
						.then(response => response.json())
				)
				.map(logoutSuccess)
				.catch(err => Rx.Observable.of(logoutError(err)))
			)
		);

export const handleLogoutSuccess = action$ =>
	action$.ofType('LOGOUT_SUCCESS')
		.map(({ payload }) =>
			configureAuth({
				oauth_token: payload.access_token,
				refresh_token: payload.refresh_token,
				expires_in: payload.expires_in,
			})
		);

function setOauthCookie({ oauth_token, expires_in }) {
	const expires = expires_in ? 1 / 24 / 3600 * expires_in : 365;  // lifetime in *days*
	Cookies.set(
		'oauth_token',
		oauth_token || '',
		{ expires }
	);
}

function setRefreshCookie({ refresh_token }) {
	Cookies.set(
		'refresh_token',
		refresh_token || '',
		{ expires: 5 * 365 }  // 5 year expiration - 'permanent'
	);
}

export const setAuthCookies = action$ =>
	action$.ofType('CONFIGURE_AUTH')
		.filter(({ meta }) => !meta)
		.map(({ payload }) => payload)
		.do(setOauthCookie)
		.do(setRefreshCookie)
		.ignoreElements();  // don't need to emit a new action here

export default combineEpics(
	handleLoginSuccess,
	handleLogoutRequest,
	handleLogoutSuccess,
	setAuthCookies
);

