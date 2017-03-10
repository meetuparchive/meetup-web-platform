import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';

import {
	MOCK_POST_ACTION,
	MOCK_APP_STATE,
} from 'meetup-web-mocks/lib/app';

import {
	createFakeStore,
	epicIgnoreAction,
} from '../util/testUtils';

import getPostEpic from './post';
import * as fetchUtils from '../util/fetchUtils';  // used for mocking
import * as syncActionCreators from '../actions/syncActionCreators';

/**
 * @module PostEpicTest
 */
MOCK_APP_STATE.config = {
	apiUrl: 'http://fake.api.meetup.com',
};
const store = createFakeStore(MOCK_APP_STATE);
describe('getPostEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(getPostEpic(fetchUtils.fetchQueries)));
	it('calls fetchQueries with `method: "POST"`', function() {
		const response = 'success';
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.resolve(response));
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => {
				expect(fetchUtils.fetchQueries.calls.count()).toBe(1);
				const fetchArgs = fetchUtils.fetchQueries.calls.argsFor(0);
				expect(fetchArgs[1].method).toEqual('POST');
				expect(fetchArgs[0]).toEqual(MOCK_APP_STATE.config.apiUrl);
			})
			.toPromise();
	});
	it('Returns response from fetchqueries as argument to API_SUCCESS', function() {
		const response = 'success';
		fetchUtils.fetchQueries = jest.fn(() => () => Promise.resolve(response));
		const noSuccessPayload = { ...MOCK_POST_ACTION.payload };
		delete noSuccessPayload.onSuccess;
		const postWithoutOnSuccess = { ...MOCK_POST_ACTION, payload: noSuccessPayload };
		spyOn(syncActionCreators, 'apiSuccess');
		const action$ = ActionsObservable.of(postWithoutOnSuccess);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.toPromise()
			.then(() => {
				expect(syncActionCreators.apiSuccess).toHaveBeenCalledWith(response);
			});
	});
	it('Returns response from fetchqueries as argument to API_SUCCESS and action\'s onSuccess', function() {
		const response = 'success';
		fetchUtils.fetchQueries = jest.fn(() => () => Promise.resolve(response));
		spyOn(MOCK_POST_ACTION.payload, 'onSuccess');
		spyOn(syncActionCreators, 'apiSuccess');
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.toPromise()
			.then(() => {
				expect(syncActionCreators.apiSuccess).toHaveBeenCalledWith(response);
				expect(MOCK_POST_ACTION.payload.onSuccess).toHaveBeenCalledWith(response);
			});
	});
	it('Returns error from fetchQueries as argument to action\'s onError', function() {
		const err = new Error('boo');
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.reject(err));
		spyOn(MOCK_POST_ACTION.payload, 'onError');
		// The promises resolve async, but resolution is not accessible to test, so
		// we use a setTimeout to make sure execution has completed
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => expect(MOCK_POST_ACTION.payload.onError).toHaveBeenCalledWith(err))
			.toPromise();
	});
});
