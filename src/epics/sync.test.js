import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';

import fetch from 'node-fetch';
global.fetch = fetch;

import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_RENDERPROPS,
	MOCK_ROUTES,
} from 'meetup-web-mocks/lib/app';

import {
	createFakeStore,
	epicIgnoreAction,
} from '../util/testUtils';

import getSyncEpic from '../epics/sync';
import * as api from '../actions/apiActionCreators';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as authActionCreators from '../actions/authActionCreators';
import {
	CLICK_TRACK_CLEAR_ACTION,
} from '../actions/clickActionCreators';

const EMPTY_ROUTES = {};

/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(getSyncEpic(MOCK_ROUTES)));
	it('emits API_REQ and CLICK_TRACK_CLEAR for nav-related actions with matched query', function() {
		const locationChange = { type: syncActionCreators.LOCATION_CHANGE, payload: MOCK_RENDERPROPS.location };
		const serverRender = { type: '@@server/RENDER', payload: MOCK_RENDERPROPS.location };

		const fakeStore = createFakeStore({});
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
	it('emits API_REQ, CACHE_CLEAR, and CLICK_TRACK_CLEAR for nav-related actions with logout query', function() {
		const logoutLocation = {
			...MOCK_RENDERPROPS.location,
			search: '?foo=bar&logout=true',
		};
		const locationChange = { type: syncActionCreators.LOCATION_CHANGE, payload: logoutLocation };

		const fakeStore = createFakeStore({});
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
		const locationChange = { type: syncActionCreators.LOCATION_CHANGE, payload: noMatchLocation };
		const serverRender = { type: '@@server/RENDER', payload: noMatchLocation };

		return epicIgnoreAction(SyncEpic, locationChange)()
			.then(epicIgnoreAction(SyncEpic, serverRender));
	});
	it('does not emit for nav-related actions with query functions that return null', () => {
		const SyncEpic = getSyncEpic(MOCK_ROUTES);

		const pathname = '/nullQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = { type: syncActionCreators.LOCATION_CHANGE, payload: noMatchLocation };
		const serverRender = { type: '@@server/RENDER', payload: noMatchLocation };

		return epicIgnoreAction(SyncEpic, locationChange)()
			.then(epicIgnoreAction(SyncEpic, serverRender));
	});


	xit('strips logout query and calls browserHistory.replace on LOGIN_SUCCESS', function() {
		const mockFetchQueries = () => () => Promise.resolve({});
		const locationWithLogout = {
			...MOCK_APP_STATE.routing.locationBeforeTransitions,
			query: { logout: true },
		};
		const locationWithoutLogout = {
			...locationWithLogout,
			query: {},
		};
		const MOCK_APP_STATE_LOGOUT = {
			...MOCK_APP_STATE,
			routing: {
				locationBeforeTransitions: locationWithLogout
			}
		};

		const locationSync = authActionCreators.loginSuccess();
		const action$ = ActionsObservable.of(locationSync);
		const fakeStore = createFakeStore(MOCK_APP_STATE_LOGOUT);
		return getSyncEpic(EMPTY_ROUTES, mockFetchQueries)(action$, fakeStore)
			.toPromise()
			.then(() => {
				expect(require('react-router').browserHistory.replace).toHaveBeenCalledWith(locationWithoutLogout);
			});
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

	it('emits API_RESP_FAIL on failed API_REQ', function() {
		const mockFetchQueries = () => () => Promise.reject(new Error());

		const queries = [mockQuery({})];
		const apiRequest = api.requestAll(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(EMPTY_ROUTES, mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions =>
				expect(actions.map(a => a.type)).toEqual([
					api.API_RESP_FAIL,
					'API_ERROR',
					api.API_RESP_COMPLETE
				])
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

