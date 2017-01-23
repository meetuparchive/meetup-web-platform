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
				responses: [{ foo: 'bar'}, { bar: 'baz' }, { baz: 'foo' }],
			},
		};
		expect(app(undefined, API_SUCCESS)).toEqual({
			foo: 'bar',
			bar: 'baz',
			baz: 'foo',
		});
	});
	it('populates an `error` key on API_ERROR', () => {
		const API_ERROR = {
			type: 'API_ERROR',
			payload: new Error('this is the worst'),
		};
		const errorState = app(undefined, API_ERROR);
		expect(errorState.error).toBe(API_ERROR.payload);
	});
});

describe('clickTracking reducer', () => {
	it('appends a click action to state.clicks', () => {
		const initialState = { clicks: [{ bar: 'baz' }] };
		const click = { foo: 'bar' };
		const action = clickActionCreators.click(click);
		expect(clickTracking(initialState, action).clicks.length).toBe(2);
		expect(clickTracking(initialState, action).clicks[1]).toEqual(click);
	});
	it('clears click data on clear clicks', () => {
		const initialState = { clicks: [{ bar: 'baz' }] };
		const action = clickActionCreators.clearClick();
		expect(clickTracking(initialState, action)).toBe(DEFAULT_CLICK_TRACK);
	});
	it('returns unmodified state for non-click actions', () => {
		const initialState = { clicks: [{ bar: 'baz' }] };
		expect(clickTracking(initialState, { type: 'FOO' })).toBe(initialState);
	});
});

