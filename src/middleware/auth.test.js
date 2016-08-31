import { middlewareDispatcher } from '../util/testUtils';
import { MOCK_APP_STATE } from '../util/mocks/app';
import AuthMiddleware from './auth';
import * as authActionCreators from '../actions/authActionCreators';

/**
 * Middleware tests require a mock `dispatch` method and a mock `createStore`.
 * @see {@link http://redux.js.org/docs/recipes/WritingTests.html#middleware}
 *
 * @module AuthMiddlewareTest
 */
describe('AuthMiddleware', () => {
	const authDispatcher = middlewareDispatcher(AuthMiddleware);
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
	it('dispatches', function() {
		expect(authDispatcher(MOCK_APP_STATE, this.loginSuccessAction))
			.toEqual(this.loginSuccessAction);  // end of dispatch chain is the action
	});
	it('dispatches configureAuth on LOGIN_SUCCESS', function() {
		spyOn(authActionCreators, 'configureAuth');
		authDispatcher(MOCK_APP_STATE, this.loginSuccessAction);
		expect(authActionCreators.configureAuth).toHaveBeenCalled();
	});
	it('dispatches configureAuth on LOGIN_SUCCESS', function() {
		spyOn(authActionCreators, 'configureAuth');
		authDispatcher(MOCK_APP_STATE, this.loginSuccessAction);
		expect(authActionCreators.configureAuth).toHaveBeenCalled();
	});
	it('dispatches configureAuth on LOGOUT_REQUEST', function() {
		spyOn(authActionCreators, 'configureAuth');
		authDispatcher(MOCK_APP_STATE, this.logoutAction);
		expect(authActionCreators.configureAuth).toHaveBeenCalled();
	});
});

