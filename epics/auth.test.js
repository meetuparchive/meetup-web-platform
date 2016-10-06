import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import Cookies from 'js-cookie';
import {
	MOCK_LOGIN_RESPONSE
} from '../util/mocks/app';
import {
	epicIgnoreArbitrary
} from '../util/testUtils';
import * as authActionCreators from '../actions/authActionCreators';
import AuthEpic from './auth';

describe('AuthEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreArbitrary(AuthEpic));
	it('emits CONFIGURE_AUTH on LOGIN_SUCCESS', function() {
		const loginSuccessAction = authActionCreators.loginSuccess(MOCK_LOGIN_RESPONSE);
		const action$ = ActionsObservable.of(loginSuccessAction);
		return AuthEpic(action$)
			.toPromise()
			.then(action => expect(action.type).toEqual('CONFIGURE_AUTH'));
	});
	it('emits CONFIGURE_AUTH on LOGOUT_SUCCESS', function() {
		const action$ = ActionsObservable.of(authActionCreators.logoutSuccess({}));
		return AuthEpic(action$)
			.toPromise()
			.then(action => expect(action.type).toEqual('CONFIGURE_AUTH'));
	});
	it('emits CONFIGURE_AUTH then LOGOUT_SUCCESS on successful LOGOUT_REQUEST', function() {
		global.fetch = () => {
			return Promise.resolve({
				json: () => Promise.resolve({})
			});
		};
		const logoutRequest = authActionCreators.logoutRequest();
		const action$ = ActionsObservable.of(logoutRequest);
		return AuthEpic(action$)
			.toArray()
			.toPromise()
			.then(
				actions =>
					expect(actions.map(({ type }) => type))
					.toEqual(['CONFIGURE_AUTH', 'LOGOUT_SUCCESS'])
			);
	});
	it('emits CONFIGURE_AUTH then LOGOUT_ERROR on failed LOGOUT_REQUEST', function() {
		global.fetch = () => Promise.reject(new Error());
		const logoutRequest = authActionCreators.logoutRequest();
		const action$ = ActionsObservable.of(logoutRequest);
		return AuthEpic(action$)
			.toArray()
			.toPromise()
			.then(
				actions =>
					expect(actions.map(({ type }) => type))
						.toEqual(['CONFIGURE_AUTH', 'LOGOUT_ERROR'])
			);
	});
	it('sets 3 cookies on CONFIGURE_AUTH', function(done) {
		const cookieNames = ['oauth_token', 'refresh_token', 'anonymous'];
		spyOn(Cookies, 'set');
		const configureAuthAction = authActionCreators.configureAuth({});
		const action$ = ActionsObservable.of(configureAuthAction);
		const epic$ = AuthEpic(action$)
			.do(null, null, () =>
				expect(Cookies.set.calls.allArgs().map(args => args[0]).sort())  // first arg is cookie name
					.toEqual(cookieNames.sort())
			);

		// no action expected, just 'completed' after cookies are set
		epic$.subscribe(null, null, done);
	});
});

