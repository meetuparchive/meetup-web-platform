import { ActionsObservable } from 'redux-observable';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';

import { getDeprecatedSuccessPayload } from '../util/fetchUtils';

import {
	MOCK_POST_ACTION,
	MOCK_DELETE_ACTION,
	MOCK_APP_STATE,
} from 'meetup-web-mocks/lib/app';

import {
	createFakeStore,
	epicIgnoreAction,
} from '../util/testUtils';

import { getPostEpic, getDeleteEpic } from './mutate';
import * as fetchUtils from '../util/fetchUtils';  // used for mocking
import * as syncActionCreators from '../actions/syncActionCreators';

MOCK_APP_STATE.config = {
	apiUrl: 'http://fake.api.meetup.com',
};
const store = createFakeStore(MOCK_APP_STATE);
describe('getPostEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(getPostEpic(fetchUtils.fetchQueries)));
	it('sets query.meta.method = "post"', function() {
		const innerFetchQueries = jest.fn();
		fetchUtils.fetchQueries = jest.fn(() => innerFetchQueries);
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => {
				const fetchedQueries = innerFetchQueries.mock.calls[0][0];
				expect(fetchedQueries[0].meta)
					.toEqual(expect.objectContaining({ method: 'post' }));
			})
			.toPromise();
	});

	it('Returns response from fetchqueries as argument to API_SUCCESS', function() {
		const response = { successes: [{ query: {}, response: { ref: 'asdf', foo: 'bar' } }], errors: [] };
		const deprecatedResponse = getDeprecatedSuccessPayload(response.successes, response.errors);
		fetchUtils.fetchQueries = jest.fn(() => () => Promise.resolve(response));
		const noSuccessPayload = { ...MOCK_POST_ACTION.payload };
		delete noSuccessPayload.onSuccess;
		const postWithoutOnSuccess = { ...MOCK_POST_ACTION, payload: noSuccessPayload };
		spyOn(syncActionCreators, 'apiSuccess');
		const action$ = ActionsObservable.of(postWithoutOnSuccess);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(syncActionCreators.apiSuccess)
					.toHaveBeenCalledWith(deprecatedResponse);
			});
	});
	it('Returns error from fetchQueries as argument to API_ERROR', function() {
		const err = new Error('boo');
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.reject(err));
		spyOn(syncActionCreators, 'apiError');
		// The promises resolve async, but resolution is not accessible to test, so
		// we use a setTimeout to make sure execution has completed
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => expect(syncActionCreators.apiError).toHaveBeenCalledWith(err))
			.toPromise();
	});
	it('Returns response from fetchqueries as argument to API_SUCCESS and action\'s onSuccess', function() {
		const response = { successes: [{ query: {}, response: { ref: 'asdf', foo: 'bar' } }], errors: [] };
		const deprecatedResponse = getDeprecatedSuccessPayload(response.successes, response.errors);
		fetchUtils.fetchQueries = jest.fn(() => () => Promise.resolve(response));
		spyOn(MOCK_POST_ACTION.payload, 'onSuccess');
		spyOn(syncActionCreators, 'apiSuccess');
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return getPostEpic(fetchUtils.fetchQueries)(action$, store)
			.toPromise()
			.then(() => {
				expect(syncActionCreators.apiSuccess)
					.toHaveBeenCalledWith(deprecatedResponse);
				expect(syncActionCreators.apiSuccess).toHaveBeenCalledWith(deprecatedResponse);
				expect(MOCK_POST_ACTION.payload.onSuccess).toHaveBeenCalledWith(deprecatedResponse);
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

describe('getDeleteEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(getDeleteEpic(fetchUtils.fetchQueries)));
	it('sets query.meta.method = "delete"', function() {
		const innerFetchQueries = jest.fn();
		fetchUtils.fetchQueries = jest.fn(() => innerFetchQueries);
		const action$ = ActionsObservable.of(MOCK_DELETE_ACTION);
		return getDeleteEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => {
				const fetchedQueries = innerFetchQueries.mock.calls[0][0];
				expect(fetchedQueries[0].meta)
					.toEqual(expect.objectContaining({ method: 'delete' }));
			})
			.toPromise();
	});
	it('Returns response from fetchqueries as argument to API_SUCCESS', function() {
		const response = { successes: [{ query: {}, response: { ref: 'asdf', foo: 'bar' } }], errors: [] };
		const deprecatedResponse = getDeprecatedSuccessPayload(response.successes, response.errors);
		fetchUtils.fetchQueries = jest.fn(() => () => Promise.resolve(response));
		const noSuccessPayload = { ...MOCK_DELETE_ACTION.payload };
		delete noSuccessPayload.onSuccess;
		const postWithoutOnSuccess = { ...MOCK_DELETE_ACTION, payload: noSuccessPayload };
		spyOn(syncActionCreators, 'apiSuccess');
		const action$ = ActionsObservable.of(postWithoutOnSuccess);
		return getDeleteEpic(fetchUtils.fetchQueries)(action$, store)
			.toPromise()
			.then(() => {
				expect(syncActionCreators.apiSuccess).toHaveBeenCalledWith(deprecatedResponse);
			});
	});
	it('Returns error from fetchQueries as argument to API_ERROR', function() {
		const err = new Error('boo');
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.reject(err));
		spyOn(syncActionCreators, 'apiError');
		// The promises resolve async, but resolution is not accessible to test, so
		// we use a setTimeout to make sure execution has completed
		const action$ = ActionsObservable.of(MOCK_DELETE_ACTION);
		return getDeleteEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => expect(syncActionCreators.apiError).toHaveBeenCalledWith(err))
			.toPromise();
	});
	it('Returns response from fetchqueries as argument to API_SUCCESS and action\'s onSuccess', function() {
		const response = { successes: [{ query: {}, response: { ref: 'asdf', foo: 'bar' } }], errors: [] };
		const deprecatedResponse = getDeprecatedSuccessPayload(response.successes, response.errors);
		fetchUtils.fetchQueries = jest.fn(() => () => Promise.resolve(response));
		spyOn(MOCK_DELETE_ACTION.payload, 'onSuccess');
		spyOn(syncActionCreators, 'apiSuccess');
		const action$ = ActionsObservable.of(MOCK_DELETE_ACTION);
		return getDeleteEpic(fetchUtils.fetchQueries)(action$, store)
			.toPromise()
			.then(() => {
				expect(syncActionCreators.apiSuccess).toHaveBeenCalledWith(deprecatedResponse);
				expect(MOCK_DELETE_ACTION.payload.onSuccess).toHaveBeenCalledWith(deprecatedResponse);
			});
	});
	it('Returns error from fetchQueries as argument to action\'s onError', function() {
		const err = new Error('boo');
		spyOn(fetchUtils, 'fetchQueries').and.callFake(() => () => Promise.reject(err));
		spyOn(MOCK_DELETE_ACTION.payload, 'onError');
		// The promises resolve async, but resolution is not accessible to test, so
		// we use a setTimeout to make sure execution has completed
		const action$ = ActionsObservable.of(MOCK_DELETE_ACTION);
		return getDeleteEpic(fetchUtils.fetchQueries)(action$, store)
			.do(() => expect(MOCK_DELETE_ACTION.payload.onError).toHaveBeenCalledWith(err))
			.toPromise();
	});
});
