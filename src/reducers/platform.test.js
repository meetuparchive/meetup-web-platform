import * as syncActionCreators from '../actions/syncActionCreators';
import {
	DEFAULT_APP_STATE,
	app,
} from './platform';

describe('reducer', () => {
	beforeEach(function() {
		this.MOCK_STATE = { foo: 'bar' };
	});
	it('returns default state for empty action', () => {
		expect(app(undefined, {})).toEqual(DEFAULT_APP_STATE);
	});
	it('re-sets app state on logout API_REQUEST', () => {
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
	it('app data should be cleared by a LOGOUT_REQUEST event', function() {
		expect(app(this.MOCK_STATE, { type: 'LOGOUT_REQUEST' })).toEqual(DEFAULT_APP_STATE);
	});
});
