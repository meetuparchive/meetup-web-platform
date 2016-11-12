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

import {
	logoutSuccess,
	logoutError,
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

export const handleLogoutRequest = action$ =>
	action$.ofType('LOGOUT_REQUEST')
		.flatMap(action =>
			Rx.Observable.merge(
				// immediately clear auth information so no more private data is accessible
				// - this will put the app in limbo, unable to request any more data until
				// a new token is provided by `LOGOUT_SUCESS` or a full refresh
				Rx.Observable.fromPromise(
					fetch(AUTH_ENDPOINT, { credentials: 'same-origin' })  // response will set cookies
						.then(response => response.json())
				)
				.map(logoutSuccess)
				.catch(err => Rx.Observable.of(logoutError(err)))
			)
		);

export default combineEpics(
	handleLogoutRequest
);

