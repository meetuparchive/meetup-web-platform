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
import getSyncEpics, {
	getFetchQueriesEpic,
	getNavEpic,
	apiRequestToApiReq,
	clickEpic,
} from './';
import { API_RESP_COMPLETE } from '../../lib/sync/apiActionCreators';

MOCK_APP_STATE.config = {};
MOCK_APP_STATE.routing = {};
const MAKE_MOCK_FIND_MATCHES = (queryFn = () => ({ params: {} })) => () => [
	{
		route: { path: '/', query: queryFn },
		match: { path: '/', params: {} },
	},
];

const flattenArray = arrays => [].concat.apply([], arrays);
/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	it('does not emit actions for undefined action input', () =>
		Promise.all(getSyncEpics(MOCK_ROUTES).map(e => e({ type: 'asdf' })))
			.then(flattenArray)
			.then(actions => expect(actions).toHaveLength(0)));
	describe('getNavEpic', () => {
		it('emits API_REQ for nav-related actions with matched query', function() {
			const locationChange = {
				type: LOCATION_CHANGE,
				payload: MOCK_RENDERPROPS.location,
			};
			const serverRender = {
				type: SERVER_RENDER,
				payload: MOCK_RENDERPROPS.location,
			};

			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const navEpic = getNavEpic(MAKE_MOCK_FIND_MATCHES());
			return Promise.all([
				navEpic(locationChange, fakeStore),
				navEpic(serverRender, fakeStore),
			]).then(actionArrays => {
				actionArrays.forEach(actions => {
					const types = actions.map(a => a.type);
					expect(types).toContain(api.API_REQ);
				});
			});
		});
		it('emits API_REQ, CACHE_CLEAR for nav-related actions with logout request', function() {
			const logoutLocation = {
				...MOCK_RENDERPROPS.location,
				pathname: '/logout',
			};
			const locationChange = {
				type: LOCATION_CHANGE,
				payload: logoutLocation,
			};

			const fakeStore = createFakeStore(MOCK_APP_STATE);
			return getNavEpic(MAKE_MOCK_FIND_MATCHES())(
				locationChange,
				fakeStore
			).then(actions => {
				const types = actions.map(a => a.type);
				expect(types).toContain(api.API_REQ);
				expect(types.includes(CACHE_CLEAR)).toBe(true);
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
			const navEpic = getNavEpic(MAKE_MOCK_FIND_MATCHES(null));
			return Promise.all([
				navEpic(locationChange, fakeStore),
				navEpic(serverRender, fakeStore),
			]).then(actionArrays => {
				actionArrays.forEach(actions => {
					expect(actions.map(({ type }) => type)).toEqual([API_RESP_COMPLETE]);
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
			const navEpic = getNavEpic(MAKE_MOCK_FIND_MATCHES(() => null));
			return Promise.all([
				navEpic(locationChange, fakeStore),
				navEpic(serverRender, fakeStore),
			]).then(actionArrays => {
				actionArrays.forEach(actions => {
					expect(actions.map(({ type }) => type)).toEqual([API_RESP_COMPLETE]);
				});
			});
		});
	});
	describe('getFetchQueriesEpic', () => {
		it('emits API_RESP_SUCCESS and API_RESP_COMPLETE on successful API_REQ', function() {
			const mockFetchQueries = () => () => Promise.resolve({ successes: [{}] });

			const queries = [mockQuery({})];
			const apiRequest = api.get(queries);
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			const fqEpic = getFetchQueriesEpic(
				MAKE_MOCK_FIND_MATCHES(),
				mockFetchQueries
			);
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
			const fqEpic = getFetchQueriesEpic(
				MAKE_MOCK_FIND_MATCHES(),
				mockFetchQueries
			);

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
			const fqEpic = getFetchQueriesEpic(
				MAKE_MOCK_FIND_MATCHES(),
				mockFetchQueries
			);

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
			return getFetchQueriesEpic(MAKE_MOCK_FIND_MATCHES(), mockFetchQueries)(
				apiRequest,
				fakeStore
			).then(actions => {
				expect(apiRequest.meta.resolve).toHaveBeenCalledWith(expectedSuccesses);
			});
		});

		it('emits API_RESP_FAIL on failed API_REQ', function() {
			const mockFetchQueries = () => () =>
				Promise.reject(new Error('mock error'));

			const queries = [mockQuery({})];
			const apiRequest = api.get(queries);
			apiRequest.meta.request.catch(() => {}); // ignore the rejected request
			const fakeStore = createFakeStore(MOCK_APP_STATE);
			return getFetchQueriesEpic(MAKE_MOCK_FIND_MATCHES(), mockFetchQueries)(
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
			return getFetchQueriesEpic(MAKE_MOCK_FIND_MATCHES(), mockFetchQueries)(
				apiRequest,
				fakeStore
			).then(actions =>
				expect(apiRequest.meta.reject).toHaveBeenCalledWith(expectedError)
			);
		});
	});
	describe('clickEpic', () => {
		it('emits CLICK_CLEAR for API_REQ with meta.clickAction', function() {
			const reqClicks = {
				type: api.API_REQ,
				payload: {},
				meta: {
					clickTracking: true,
				},
			};

			const fakeStore = createFakeStore(MOCK_APP_STATE);
			return clickEpic(reqClicks, fakeStore).then(actions => {
				expect(actions).toHaveLength(1);
				expect(actions[0].type).toBe(CLICK_TRACK_CLEAR_ACTION);
			});
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
