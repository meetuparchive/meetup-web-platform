import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';
import { ActionsObservable } from 'redux-observable';
import { CLICK_TRACK_CLEAR_ACTION } from 'mwp-tracking-plugin/lib/util/clickState';
import { LOCATION_CHANGE, SERVER_RENDER } from 'mwp-router';
import { createFakeStore } from 'mwp-test-utils';
import { epicIgnoreAction } from '../util/testUtils';

import fetch from 'node-fetch';
global.fetch = fetch;

import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_RENDERPROPS,
	MOCK_ROUTES,
} from 'meetup-web-mocks/lib/app';

import * as api from './apiActionCreators';
import * as syncActionCreators from './syncActionCreators';
import getSyncEpic, { getFetchQueriesEpic } from './';

const EMPTY_ROUTES = {};

MOCK_APP_STATE.config = {};
MOCK_APP_STATE.routing = {};

/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	it(
		'does not pass through arbitrary actions',
		epicIgnoreAction(getSyncEpic(MOCK_ROUTES))
	);
	it('emits API_REQ and CLICK_TRACK_CLEAR for nav-related actions with matched query', function() {
		const locationChange = {
			type: LOCATION_CHANGE,
			payload: MOCK_RENDERPROPS.location,
		};
		const serverRender = {
			type: '@@server/RENDER',
			payload: MOCK_RENDERPROPS.location,
		};

		const fakeStore = createFakeStore(MOCK_APP_STATE);
		const action$ = ActionsObservable.of(locationChange, serverRender);
		return getSyncEpic(MOCK_ROUTES)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				const types = actions.map(a => a.type);
				expect(types).toContain(api.API_REQ);
				expect(types.includes(CLICK_TRACK_CLEAR_ACTION)).toBe(true);
			});
	});
	it('emits API_REQ, CACHE_CLEAR, and CLICK_TRACK_CLEAR for nav-related actions with logout request', function() {
		const logoutLocation = {
			...MOCK_RENDERPROPS.location,
			pathname: '/logout',
		};
		const locationChange = {
			type: LOCATION_CHANGE,
			payload: logoutLocation,
		};

		const fakeStore = createFakeStore(MOCK_APP_STATE);
		const action$ = ActionsObservable.of(locationChange);
		return getSyncEpic(MOCK_ROUTES)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				const types = actions.map(a => a.type);
				expect(types).toContain(api.API_REQ);
				expect(types.includes('CACHE_CLEAR')).toBe(true);
				expect(types.includes(CLICK_TRACK_CLEAR_ACTION)).toBe(true);
			});
	});
	it('does not emit for nav-related actions without matched query', () => {
		const SyncEpic = getSyncEpic(MOCK_ROUTES);

		const pathname = '/noQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = {
			type: LOCATION_CHANGE,
			payload: noMatchLocation,
		};
		const serverRender = {
			type: SERVER_RENDER,
			payload: noMatchLocation,
		};

		return epicIgnoreAction(SyncEpic, locationChange)().then(
			epicIgnoreAction(SyncEpic, serverRender)
		);
	});
	it('does not emit for nav-related actions with query functions that return null', () => {
		const SyncEpic = getSyncEpic(MOCK_ROUTES);

		const pathname = '/nullQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = {
			type: LOCATION_CHANGE,
			payload: noMatchLocation,
		};
		const serverRender = {
			type: SERVER_RENDER,
			payload: noMatchLocation,
		};

		return epicIgnoreAction(SyncEpic, locationChange)().then(
			epicIgnoreAction(SyncEpic, serverRender)
		);
	});

	it('emits API_RESP_SUCCESS and API_RESP_COMPLETE on successful API_REQ', function() {
		const mockFetchQueries = () => () => Promise.resolve({ successes: [{}] });

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(EMPTY_ROUTES, mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(actions.map(({ type }) => type)).toEqual([
					api.API_RESP_SUCCESS,
					'API_SUCCESS',
					api.API_RESP_COMPLETE,
				]);
			});
	});

	it('does not emit API_RESP_SUCCESS when API_REQ is interrupted by LOCATION_CHANGE', () => {
		const mockFetchQueries = () => () =>
			new Promise((resolve, reject) =>
				setTimeout(() => resolve({ successes: [{}] }), 10)
			);

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		const action$ = ActionsObservable.of(apiRequest, { type: LOCATION_CHANGE }); // request immediately followed by LOCATION_CHANGE
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getFetchQueriesEpic(mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(actions.map(({ type }) => type)).not.toContain(
					api.API_RESP_SUCCESS
				);
			});
	});
	it('emits API_RESP_COMPLETE when API_REQ is interrupted by LOCATION_CHANGE', function() {
		const mockFetchQueries = () => () =>
			new Promise((resolve, reject) =>
				setTimeout(() => resolve({ successes: [{}] }), 10)
			);

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		const action$ = ActionsObservable.of(apiRequest, {
			type: LOCATION_CHANGE,
		}); // request immediately followed by LOCATION_CHANGE
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getFetchQueriesEpic(mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(actions.map(({ type }) => type)).toContain(
					api.API_RESP_COMPLETE
				);
			});
	});

	it('calls action.meta.resolve successful API_REQ', function() {
		const expectedSuccesses = [{}];
		const mockFetchQueries = () => () =>
			Promise.resolve({ successes: expectedSuccesses });

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		apiRequest.meta.resolve = jest.fn();
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(EMPTY_ROUTES, mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(apiRequest.meta.resolve).toHaveBeenCalledWith(expectedSuccesses);
			});
	});

	it('emits API_RESP_FAIL on failed API_REQ', function() {
		const mockFetchQueries = () => () =>
			Promise.reject(new Error('mock error'));

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(EMPTY_ROUTES, mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(actions.map(a => a.type)).toEqual([
					api.API_RESP_FAIL,
					'API_ERROR',
					api.API_RESP_COMPLETE, // DO NOT REMOVE - must _ALWAYS_ be called in order to clean up inFlight state
				]);
			});
	});
	it('calls action.meta.reject on failed API_REQ', function() {
		const expectedError = new Error();
		const mockFetchQueries = () => () => Promise.reject(expectedError);

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		apiRequest.meta.reject = jest.fn();
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(EMPTY_ROUTES, mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions =>
				expect(apiRequest.meta.reject).toHaveBeenCalledWith(expectedError)
			);
	});
});

describe('DEPRECATED support for API_REQUEST', () => {
	it('emits API_REQ for API_REQUEST', function() {
		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		return getSyncEpic(EMPTY_ROUTES, queries)(action$)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(actions).toHaveLength(1);
				expect(actions[0].type).toBe(api.API_REQ);
			});
	});
});
