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
	it('app data should be cleared by a LOGOUT_REQUEST event', function() {
		expect(app(this.MOCK_STATE, { type: 'LOGOUT_REQUEST' })).toEqual(DEFAULT_APP_STATE);
	});
});
