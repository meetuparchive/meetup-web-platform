import { MOCK_APP_STATE, MOCK_POST_ACTION } from 'platform-web/util/mocks/app';
import { middlewareDispatcher } from 'platform-web/util/testUtils';
import PostMiddleware from './post';
import * as fetchUtils from '../util/fetchUtils';  // used for mocking

/**
 * Middleware tests require a mock `dispatch` method and a mock `createStore`.
 * @see {@link http://redux.js.org/docs/recipes/WritingTests.html#middleware}
 *
 * @module PostMiddlewareTest
 */
describe('PostMiddleware', () => {
	const postDispatcher = middlewareDispatcher(PostMiddleware);
	it('dispatches', function() {
		const dummyAction = { type: 'DUMMY' };
		expect(postDispatcher(MOCK_APP_STATE, dummyAction))
			.toEqual(dummyAction);  // end of dispatch chain is the action
	});
	it('calls fetchQueries when given a POST action', function() {
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.resolve());
		postDispatcher(MOCK_APP_STATE, MOCK_POST_ACTION);
		expect(fetchUtils.fetchQueries)
			.toHaveBeenCalled();
	});
	it('calls onSuccess with successful fetch', function(done) {
		const result = 'Hooray';
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.resolve(result));
		spyOn(MOCK_POST_ACTION.payload, 'onSuccess');
		postDispatcher(MOCK_APP_STATE, MOCK_POST_ACTION);
		// The promises resolve async, but resolution is not accessible to test, so
		// we use a setTimeout to make sure execution has completed
		jest.useRealTimers();
		setTimeout(() => {
			expect(MOCK_POST_ACTION.payload.onSuccess)
				.toHaveBeenCalledWith(result);
			done();
		}, 0);
	});
	it('calls onError with rejected fetch', function(done) {
		const result = new Error('boo');
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.reject(result));
		spyOn(MOCK_POST_ACTION.payload, 'onError');
		postDispatcher(MOCK_APP_STATE, MOCK_POST_ACTION);
		// The promises resolve async, but resolution is not accessible to test, so
		// we use a setTimeout to make sure execution has completed
		jest.useRealTimers();
		setTimeout(() => {
			expect(MOCK_POST_ACTION.payload.onError)
				.toHaveBeenCalledWith(result);
			done();
		}, 0);
	});
});
