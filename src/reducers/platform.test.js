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
	it('re-sets app state on logout API_REQUEST', function() {
		const logoutRequest = syncActionCreators.apiRequest([], { logout: true });
		expect(app(this.MOCK_STATE, logoutRequest)).toEqual(DEFAULT_APP_STATE);
	});
	it('assembles success responses into single state tree', () => {
		const API_SUCCESS = {
			type: 'API_SUCCESS',
			payload: {
				response: { ref: 'bing', bar: 'baz' },
			},
		};
		expect(app({ foo: 'bar'}, API_SUCCESS)).toEqual({
			foo: 'bar',
			bing: { bar: 'baz' },
		});
	});
	it('assembles error responses into single state tree', () => {
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

