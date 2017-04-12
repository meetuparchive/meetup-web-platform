import * as api from '../actions/apiActionCreators';
import * as cacheActionCreators from '../actions/cacheActionCreators';
import * as clickActionCreators from '../actions/clickActionCreators';
import * as syncActionCreators from '../actions/syncActionCreators';
import {
	DEFAULT_APP_STATE,
	DEFAULT_CLICK_TRACK,
	app,
	clickTracking,
} from './platform';

describe('app reducer', () => {
	beforeEach(function() {
		this.MOCK_STATE = { foo: 'bar' };
	});
	it('returns default state for empty action', () => {
		expect(app({ ...DEFAULT_APP_STATE }, {})).toEqual(DEFAULT_APP_STATE);
	});
	it('re-sets app state on logout API_REQ, with isFetching:true', function() {
		const logoutRequest = api.requestAll([], { logout: true });
		expect(app(this.MOCK_STATE, logoutRequest)).toEqual({
			...DEFAULT_APP_STATE,
			isFetching: true,
		});
	});
	it('adds success response to state tree', () => {
		const API_RESP_SUCCESS = api.success({ query: {}, response: { ref: 'bing', value: 'baz' } });
		expect(app({ foo: 'bar'}, API_RESP_SUCCESS)).toEqual({
			foo: 'bar',
			bing: { value: 'baz' }
		});
	});
	it('adds error response to state tree', () => {
		const API_RESP_ERROR = api.error({ response: { ref: 'bing', bar: 'baz' } });
		expect(app({ foo: 'bar'}, API_RESP_ERROR)).toEqual({
			foo: 'bar',
			bing: { bar: 'baz' },
		});
	});
	it('populates an `fail` key on API_RESP_FAIL', () => {
		const API_RESP_FAIL = api.fail(new Error('this is the worst'));
		const errorState = app({ ...DEFAULT_APP_STATE }, API_RESP_FAIL);
		expect(errorState).toEqual(expect.objectContaining({ fail: API_RESP_FAIL.payload }));
	});
	it('sets isFetching:true on API_REQ', () => {
		const API_REQ = api.requestAll([], {});
		const appState = app({ ...DEFAULT_APP_STATE }, API_REQ);
		expect(appState.isFetching).toBe(true);
	});
	it('sets isFetching:false on API_RESP_COMPLETE', () => {
		const API_RESP_COMPLETE = api.complete();
		[true, false, 'monkey'].forEach(isFetching => {
			const appState = app({ isFetching }, API_RESP_COMPLETE);
			expect(appState.isFetching).toBe(false);
		});
	});
	it('does not change isFetching on CACHE_SUCCESS', () => {
		const CACHE_SUCCESS = cacheActionCreators.cacheSuccess({ query: {}, response: { ref: 'foo' } });
		[true, false, 'monkey'].forEach(isFetching => {
			const appState = app({ isFetching }, CACHE_SUCCESS);
			expect(appState.isFetching).toBe(isFetching);
		});
	});
});

describe('clickTracking reducer', () => {
	it('appends a click action to state.clicks', () => {
		const initialState = { history: [{ bar: 'baz' }] };
		const click = { foo: 'bar' };
		const action = clickActionCreators.click(click);
		expect(clickTracking(initialState, action).history.length).toBe(2);
		expect(clickTracking(initialState, action).history[1]).toEqual(click);
	});
	it('clears click data on clear clicks', () => {
		const initialState = { history: [{ bar: 'baz' }] };
		const action = clickActionCreators.clearClick();
		expect(clickTracking(initialState, action)).toBe(DEFAULT_CLICK_TRACK);
	});
	it('returns unmodified state for non-click actions', () => {
		const initialState = { history: [{ bar: 'baz' }] };
		expect(clickTracking(initialState, { type: 'FOO' })).toBe(initialState);
	});
});

describe('DEPRECATED sync action reducer', () => {
	it('re-sets app state on logout API_REQUEST', function() {
		const logoutRequest = syncActionCreators.apiRequest([], { logout: true });
		expect(app(this.MOCK_STATE, logoutRequest)).toEqual(DEFAULT_APP_STATE);
	});
	it('assembles success responses into single state tree', () => {
		const API_SUCCESS = {
			type: 'API_SUCCESS',
			payload: {
				responses: [{ foo: 'bar'}, { bar: 'baz' }, { baz: 'foo' }],
			},
		};
		expect(app({ ...DEFAULT_APP_STATE }, API_SUCCESS)).toEqual({
			foo: 'bar',
			bar: 'baz',
			baz: 'foo',
			isFetching: false,
		});
	});
	it('populates an `error` key on API_ERROR', () => {
		const API_ERROR = {
			type: 'API_ERROR',
			payload: new Error('this is the worst'),
		};
		const errorState = app({ ...DEFAULT_APP_STATE }, API_ERROR);
		expect(errorState.error).toBe(API_ERROR.payload);
	});
	it('sets isFetching:true on API_REQUEST', () => {
		const API_REQUEST = {
			type: 'API_REQUEST',
			payload: [],
			meta: {},
		};
		const appState = app({ ...DEFAULT_APP_STATE }, API_REQUEST);
		expect(appState.isFetching).toBe(true);
	});
	it('sets isFetching:false on API_SUCCESS', () => {
		const API_SUCCESS = {
			type: 'API_SUCCESS',
			payload: { queries: [], responses: [] },
		};
		[true, false, 'monkey'].forEach(isFetching => {
			const appState = app({ isFetching }, API_SUCCESS);
			expect(appState.isFetching).toBe(false);
		});
	});});
