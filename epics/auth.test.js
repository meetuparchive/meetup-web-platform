import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
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
	it('dispatches configureAuth on LOGIN_SUCCESS', function(done) {
		const action$ = ActionsObservable.of(this.loginSuccessAction);
		const epic$ = AuthEpic(action$).take(1);
		epic$.subscribe(
			action => expect(action.type).toEqual('CONFIGURE_AUTH'),
			null,
			done
		);
	});
	it('dispatches configureAuth on LOGOUT_REQUEST', function(done) {
		const action$ = ActionsObservable.of(this.logoutAction);
		const epic$ = AuthEpic(action$).take(1);
		epic$.subscribe(
			action => expect(action.type).toEqual('CONFIGURE_AUTH'),
			null,
			done
		);
	});
});


