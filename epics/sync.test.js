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
import getSyncEpic from '../epics/sync';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as authActionCreators from '../actions/authActionCreators';
/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	const routes = {};
	it('does not pass through arbitrary actions', function(done) {
		const arbitraryAction = {
			type: 'ARBITRARY',
			payload: '/'  // root location/path will query for member
		};
		const action$ = ActionsObservable.of(arbitraryAction);
		const epic$ = getSyncEpic(routes)(action$);
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
	it('emits API_REQUEST for nav-related actions with matched query', function(done) {
		const locationChange = { type: LOCATION_CHANGE, payload: MOCK_RENDERPROPS.location };
		const serverRender = { type: '@@server/RENDER', payload: MOCK_RENDERPROPS.location };
		const locationSync = syncActionCreators.locationSync(MOCK_RENDERPROPS.location);

		const action$ = ActionsObservable.of(locationChange, serverRender, locationSync);
		const epic$ = getSyncEpic(MOCK_ROUTES)(action$);
		epic$.subscribe(
			action => expect(action.type).toEqual('API_REQUEST'),
			null,
			done
		);
	});
	it('does not emit for nav-related actions without matched query', function(done) {
		const pathname = '/noQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = { type: LOCATION_CHANGE, payload: noMatchLocation };
		const serverRender = { type: '@@server/RENDER', payload: noMatchLocation };
		const locationSync = syncActionCreators.locationSync(noMatchLocation);

		const action$ = ActionsObservable.of(locationChange, serverRender, locationSync);
		const epic$ = getSyncEpic(MOCK_ROUTES)(action$);
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
	it('emits API_SUCCESS and API_COMPLETE on successful API_REQUEST', function(done) {
		global.fetch = () => {
			return Promise.resolve({
				json: () => Promise.resolve({})
			});
		};
		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		const epic$ = getSyncEpic(routes)(action$, fakeStore)
			.toArray();

		epic$.subscribe(
			actions => expect(actions.map(({ type }) => type)).toEqual(['API_SUCCESS', 'API_COMPLETE']),
			null,
			done
		);
	});
	it('emits API_ERROR on failed API_REQUEST', function(done) {
		global.fetch = () => Promise.reject(new Error());
		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		const epic$ = getSyncEpic(routes)(action$, fakeStore);

		epic$.subscribe(
			action => expect(action.type).toEqual('API_ERROR'),
			null,
			done
		);
	});

	it('emits LOCATION_SYNC with routing state on CONFIGURE_AUTH', function(done) {
		const configureAuth = authActionCreators.configureAuth({});
		const action$ = ActionsObservable.of(configureAuth);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		const epic$ = getSyncEpic(routes)(action$, fakeStore);
		epic$.subscribe(
			action => {
				expect(action.type).toEqual('LOCATION_SYNC');
				expect(action.payload).toEqual(MOCK_APP_STATE.routing.locationBeforeTransitions);
			},
			null,
			done
		);
	});
});

