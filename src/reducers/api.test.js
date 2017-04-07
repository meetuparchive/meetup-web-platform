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
		expect(app(undefined, {})).toEqual(DEFAULT_APP_STATE);
	});
	it('re-sets app state on logout API_REQUEST, with isFetching:true', function() {
		const logoutRequest = syncActionCreators.apiRequest([], { logout: true });
		expect(app(this.MOCK_STATE, logoutRequest)).toEqual({
			...DEFAULT_APP_STATE,
			isFetching: true,
		});
	});
	it('adds success response to state tree', () => {
		const API_SUCCESS = {
			type: 'API_SUCCESS',
			payload: {
				response: { ref: 'bing', value: 'baz' },
			},
		};
		expect(app({ foo: 'bar'}, API_SUCCESS)).toEqual({
			foo: 'bar',
			bing: { value: 'baz' }
		});
	});
	it('adds error response to state tree', () => {
		const API_ERROR = {
			type: 'API_ERROR',
			payload: {
				response: { ref: 'bing', bar: 'baz' },
			},
		};
		expect(app({ foo: 'bar'}, API_ERROR)).toEqual({
			foo: 'bar',
			bing: { bar: 'baz' },
		});
	});
	it('populates an `failure` key on API_FAILURE', () => {
		const API_FAILURE = {
			type: 'API_FAILURE',
			payload: new Error('this is the worst'),
		};
		const errorState = app(undefined, API_FAILURE);
		expect(errorState.failure).toBe(API_FAILURE.payload);
	});
	it('sets isFetching:true on API_REQUEST', () => {
		const API_REQUEST = {
			type: 'API_REQUEST',
			payload: [],
			meta: {},
		};
		const appState = app(undefined, API_REQUEST);
		expect(appState.isFetching).toBe(true);
	});
	it('sets isFetching:false on API_COMPLETE', () => {
		const API_COMPLETE = {
			type: 'API_COMPLETE',
		};
		[true, false, 'monkey'].forEach(isFetching => {
			const appState = app({ isFetching }, API_COMPLETE);
			expect(appState.isFetching).toBe(false);
		});
	});
	it('does not change isFetching on CACHE_SUCCESS', () => {
		const CACHE_SUCCESS = {
			type: 'CACHE_SUCCESS',
			payload: { query: {}, response: {} },
		};
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

