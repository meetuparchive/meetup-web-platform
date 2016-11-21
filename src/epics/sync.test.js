import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import fetch from 'node-fetch';
global.fetch = fetch;
import { LOCATION_CHANGE } from 'react-router-redux';
import { createFakeStore } from '../util/testUtils';
import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_RENDERPROPS,
	MOCK_ROUTES,
} from '../util/mocks/app';
import {
	epicIgnoreAction
} from '../util/testUtils';
import getSyncEpic from '../epics/sync';
import * as syncActionCreators from '../actions/syncActionCreators';
/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	const routes = {};
	it('does not pass through arbitrary actions', epicIgnoreAction(getSyncEpic(MOCK_ROUTES)));
	it('emits API_REQUEST for nav-related actions with matched query', function(done) {
		const locationChange = { type: LOCATION_CHANGE, payload: MOCK_RENDERPROPS.location };
		const serverRender = { type: '@@server/RENDER', payload: MOCK_RENDERPROPS.location };

		const action$ = ActionsObservable.of(locationChange, serverRender);
		const epic$ = getSyncEpic(MOCK_ROUTES)(action$);
		epic$.subscribe(
			action => expect(action.type).toEqual('API_REQUEST'),
			null,
			done
		);
	});
	it('does not emit for nav-related actions without matched query', () => {
		const SyncEpic = getSyncEpic(MOCK_ROUTES);

		const pathname = '/noQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = { type: LOCATION_CHANGE, payload: noMatchLocation };
		const serverRender = { type: '@@server/RENDER', payload: noMatchLocation };

		return epicIgnoreAction(SyncEpic, locationChange)()
			.then(epicIgnoreAction(SyncEpic, serverRender));
	});

	it('emits LOCATION_CHANGE on LOCATION_SYNC', function() {
		const mockFetchQueries = () => () => Promise.resolve({});

		const locationSync = syncActionCreators.locationSync();
		const action$ = ActionsObservable.of(locationSync);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(routes, mockFetchQueries)(action$, fakeStore)
			.toPromise()
			.then(action => {
				expect(action.type).toEqual(LOCATION_CHANGE);
				expect(action.payload).toEqual(MOCK_APP_STATE.routing.locationBeforeTransitions);
			});
	});

	it('emits API_SUCCESS and API_COMPLETE on successful API_REQUEST', function() {
		const mockFetchQueries = () => () => Promise.resolve({});

		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(routes, mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions =>
				expect(actions.map(({ type }) => type)).toEqual(['API_SUCCESS', 'API_COMPLETE'])
			);
	});

	it('emits API_ERROR on failed API_REQUEST', function() {
		const mockFetchQueries = () => () => Promise.reject(new Error());

		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(routes, mockFetchQueries)(action$, fakeStore)
			.toPromise()
			.then(action => expect(action.type).toEqual('API_ERROR'));
	});

});

