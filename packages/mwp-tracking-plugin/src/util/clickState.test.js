import { reducer as clickTracking } from './clickState';

describe('clickTracking reducer', () => {
	it('appends a click action to state.clicks', () => {
		const initialState = { history: [{ bar: 'baz' }] };
		const click = { foo: 'bar' };
		expect(clickTracking(initialState, click).history.length).toBe(2);
		expect(clickTracking(initialState, click).history[1]).toEqual(click);
	});
});
