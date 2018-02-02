import { CLICK_TRACK_CLEAR_ACTION } from 'mwp-tracking-plugin/lib/util/clickState';
import { LOCATION_CHANGE, SERVER_RENDER } from 'mwp-router';
import { createFakeStore } from 'mwp-test-utils';

import fetch from 'node-fetch';
global.fetch = fetch;

import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_RENDERPROPS,
	MOCK_ROUTES,
} from 'meetup-web-mocks/lib/app';

import { CACHE_CLEAR } from '../cache/cacheActionCreators';
import * as api from './apiActionCreators';
import * as syncActionCreators from './syncActionCreators';
import getSyncEpic, {
	getFetchQueriesEpic,
	getNavEpic,
	apiRequestToApiReq,
} from './';
import { API_RESP_COMPLETE } from '../../lib/sync/apiActionCreators';

MOCK_APP_STATE.config = {};
MOCK_APP_STATE.routing = {};
const MAKE_MOCK_RESOLVE_ROUTES = (queryFn = () => ({ params: {} })) => () =>
	Promise.resolve([{ route: { query: queryFn }, match: { params: {} } }]);

/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	it('does not emit actions for undefined action input', () =>
		getSyncEpic(MOCK_ROUTES)({ type: 'asdf' }).then(actions =>
			expect(actions).toHaveLength(0)
		));
	describe('getNavEpic', () => {
		it('emits API_REQ and CLICK_TRACK_CLEAR for nav-related actions with matched query', function() {
			const locationChange = {
				type: LOCATION_CHANGE,
				payload: MOCK_RENDERPROPS.location,
			};
			const serverRender = {
				type: SERVER_RENDER,
				payload: MOCK_RENDERPROPS.location,
			};

			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const navEpic = getNavEpic(MAKE_MOCK_RESOLVE_ROUTES());
			return Promise.all([
				navEpic(locationChange, fakeStore),
				navEpic(serverRender, fakeStore),
			]).then(actionArrays => {
				actionArrays.forEach(actions => {
					const types = actions.map(a => a.type);
					expect(types).toContain(api.API_REQ);
					expect(types.includes(CLICK_TRACK_CLEAR_ACTION)).toBe(true);
				});
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
			return getNavEpic(MAKE_MOCK_RESOLVE_ROUTES())(
				locationChange,
				fakeStore
			).then(actions => {
				const types = actions.map(a => a.type);
				expect(types).toContain(api.API_REQ);
				expect(types.includes(CACHE_CLEAR)).toBe(true);
				expect(types.includes(CLICK_TRACK_CLEAR_ACTION)).toBe(true);
			});
		});
		it('emits API_COMPLETE for nav-related actions without matched query', () => {
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

			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const navEpic = getNavEpic(MAKE_MOCK_RESOLVE_ROUTES(null));
			return Promise.all([
				navEpic(locationChange, fakeStore),
				navEpic(serverRender, fakeStore),
			]).then(actionArrays => {
				actionArrays.forEach(actions => {
					expect(actions.map(({ type }) => type)).toEqual([
						API_RESP_COMPLETE,
					]);
				});
			});
		});
		it('emits API_COMPLETE for nav-related actions with query functions that return null', () => {
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

			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const navEpic = getNavEpic(MAKE_MOCK_RESOLVE_ROUTES(() => null));
			return Promise.all([
				navEpic(locationChange, fakeStore),
				navEpic(serverRender, fakeStore),
			]).then(actionArrays => {
				actionArrays.forEach(actions => {
					expect(actions.map(({ type }) => type)).toEqual([
						API_RESP_COMPLETE,
					]);
				});
			});
		});
	});
	describe('getFetchQueriesEpic', () => {
		it('emits API_RESP_SUCCESS and API_RESP_COMPLETE on successful API_REQ', function() {
			const mockFetchQueries = () => () =>
				Promise.resolve({ successes: [{}] });

			const queries = [mockQuery({})];
			const apiRequest = api.get(queries);
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const fqEpic = getFetchQueriesEpic(mockFetchQueries);
			// kick off the fetch
			const doFetch = fqEpic(apiRequest, fakeStore);
			return doFetch.then(actions => {
				expect(actions.map(({ type }) => type)).toEqual([
					api.API_RESP_SUCCESS,
					'API_SUCCESS',
					api.API_RESP_COMPLETE,
				]);
			});
		});
		it('does not emit API_RESP_SUCCESS when API_REQ is interrupted by LOCATION_CHANGE', () => {
			// mock that takes 10ms to return (allows time for LOCATION_CHANGE to interrupt)
			const mockFetchQueries = () => () =>
				new Promise((resolve, reject) =>
					setTimeout(() => resolve({ successes: [{}] }), 10)
				);

			const queries = [mockQuery({})];
			const apiRequest = api.get(queries);
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const fqEpic = getFetchQueriesEpic(mockFetchQueries);

			// kick off the fetch
			const doFetch = fqEpic(apiRequest, fakeStore);
			// immediately trigger a location change
			fqEpic({ type: LOCATION_CHANGE }, fakeStore);

			return doFetch.then(actions => {
				expect(actions.map(({ type }) => type)).not.toContain(
					api.API_RESP_SUCCESS
				);
			});
		});
		it('emits API_RESP_COMPLETE when API_REQ is interrupted by LOCATION_CHANGE', function() {
			// mock that takes 10ms to return (allows time for LOCATION_CHANGE to interrupt)
			const mockFetchQueries = () => () =>
				new Promise((resolve, reject) =>
					setTimeout(() => resolve({ successes: [{}] }), 10)
				);

			const queries = [mockQuery({})];
			const apiRequest = api.get(queries);
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const fqEpic = getFetchQueriesEpic(mockFetchQueries);

			// kick off the fetch
			const doFetch = fqEpic(apiRequest, fakeStore);
			// immediately trigger a location change
			fqEpic({ type: LOCATION_CHANGE }, fakeStore);

			return doFetch.then(actions => {
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
			const apiRequest = api.get(queries);
			apiRequest.meta.resolve = jest.fn();
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			return getFetchQueriesEpic(mockFetchQueries)(
				apiRequest,
				fakeStore
			).then(actions => {
				expect(apiRequest.meta.resolve).toHaveBeenCalledWith(
					expectedSuccesses
				);
			});
		});

		it('emits API_RESP_FAIL on failed API_REQ', function() {
			const mockFetchQueries = () => () =>
				Promise.reject(new Error('mock error'));

			const queries = [mockQuery({})];
			const apiRequest = api.get(queries);
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			return getFetchQueriesEpic(mockFetchQueries)(
				apiRequest,
				fakeStore
			).then(actions => {
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
			const apiRequest = api.get(queries);
			apiRequest.meta.reject = jest.fn();
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			return getFetchQueriesEpic(mockFetchQueries)(
				apiRequest,
				fakeStore
			).then(actions =>
				expect(apiRequest.meta.reject).toHaveBeenCalledWith(
					expectedError
				)
			);
		});
	});
});

describe('DEPRECATED apiRequestToApiReq', () => {
	it('emits API_REQ for API_REQUEST', function() {
		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		return apiRequestToApiReq(apiRequest).then(actions => {
			expect(actions).toHaveLength(1);
			expect(actions[0].type).toBe(api.API_REQ);
		});
	});
});
