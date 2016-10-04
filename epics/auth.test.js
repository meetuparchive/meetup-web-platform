import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import Cookies from 'js-cookie';
import * as authActionCreators from '../actions/authActionCreators';
import AuthEpic from './auth';

describe('AuthEpic', () => {
	it('does not pass through arbitrary actions', function(done) {
		const arbitraryAction = {
			type: 'ARBITRARY',
			payload: '/'  // root location/path will query for member
		};
		const action$ = ActionsObservable.of(arbitraryAction);
		const epic$ = AuthEpic(action$);
		const spyable = {
			notCalled: () => {}
		};
		spyOn(spyable, 'notCalled');
		epic$.subscribe(
			spyable.notCalled,
			null,
			() => {
				expect(spyable.notCalled).not.toHaveBeenCalled();
				done();
			}
		);
	});
	beforeEach(function() {
		const MOCK_LOGIN_RESPONSE = {
			value: {
				member: {},
				oauth_token: 1234
			}
		};
		this.loginSuccessAction = authActionCreators.loginSuccess(MOCK_LOGIN_RESPONSE);
		this.logoutAction = authActionCreators.logoutRequest();
	});
	it('emits CONFIGURE_AUTH on LOGIN_SUCCESS', function(done) {
		const action$ = ActionsObservable.of(this.loginSuccessAction);
		const epic$ = AuthEpic(action$).take(1);
		epic$.subscribe(
			action => expect(action.type).toEqual('CONFIGURE_AUTH'),
			null,
			done
		);
	});
	it('emits CONFIGURE_AUTH on LOGOUT_REQUEST', function(done) {
		const action$ = ActionsObservable.of(this.logoutAction);
		const epic$ = AuthEpic(action$).take(1);
		epic$.subscribe(
			action => expect(action.type).toEqual('CONFIGURE_AUTH'),
			null,
			done
		);
	});
	it('emits CONFIGURE_AUTH on LOGOUT_REQUEST', function(done) {
		const action$ = ActionsObservable.of(authActionCreators.logoutSuccess({}));
		const epic$ = AuthEpic(action$).take(1);
		epic$.subscribe(
			action => expect(action.type).toEqual('CONFIGURE_AUTH'),
			null,
			done
		);
	});
	it('emits CONFIGURE_AUTH then LOGOUT_SUCCESS on successful LOGOUT_REQUEST', function(done) {
		global.fetch = () => {
			return Promise.resolve({
				json: () => Promise.resolve({})
			});
		};
		const logoutRequest = authActionCreators.logoutRequest();
		const action$ = ActionsObservable.of(logoutRequest);
		const epic$ = AuthEpic(action$)
			.toArray();

		epic$.subscribe(
			actions => expect(actions.map(({ type }) => type)).toEqual(['CONFIGURE_AUTH', 'LOGOUT_SUCCESS']),
			null,
			done
		);
	});
	it('emits CONFIGURE_AUTH then LOGOUT_ERROR on failed LOGOUT_REQUEST', function(done) {
		global.fetch = () => Promise.reject(new Error());
		const logoutRequest = authActionCreators.logoutRequest();
		const action$ = ActionsObservable.of(logoutRequest);
		const epic$ = AuthEpic(action$)
			.toArray();

		epic$.subscribe(
			actions => expect(actions.map(({ type }) => type)).toEqual(['CONFIGURE_AUTH', 'LOGOUT_ERROR']),
			null,
			done
		);
	});
	it('sets 3 cookies on CONFIGURE_AUTH', function(done) {
		spyOn(Cookies, 'set');
		const action$ = ActionsObservable.of(authActionCreators.configureAuth({}));
		const epic$ = AuthEpic(action$);

		epic$.subscribe(
			null,
			null,
			() => {
				expect(Cookies.set.calls.count()).toBe(3);
				done();
			}
		);

	});
});

