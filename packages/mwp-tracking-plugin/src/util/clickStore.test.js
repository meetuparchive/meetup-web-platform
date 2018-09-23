import { createStore } from 'redux';
import { clickTrackEnhancer, clickMiddleware } from './clickStore';
const mockClickState = require('./clickState');

jest.mock('./clickState', () => ({
	CLICK_TRACK_ACTION: 'foo',
	appendClick: jest.fn(),
}));

const IDENTITY_REDUCER = state => state;

// skipping this test because it must run in a browser environment (need to set up jest to run jsdom for this test)
describe.skip('clickTrackEnhancer', () => {
	global.window = {};
	global.window.Event = function() {};
	global.document = {
		body: {
			addEventListener() {},
		},
	};
	it('adds event listeners to document.body', () => {
		spyOn(global.document.body, 'addEventListener');
		const enhancedCreateStore = clickTrackEnhancer(createStore);
		enhancedCreateStore(IDENTITY_REDUCER);
		const args = global.document.body.addEventListener.calls.allArgs();
		const eventNames = args.map(a => a[0]);
		const handlers = args.map(a => a[1]);

		expect(eventNames).toEqual(['click', 'change']);
		expect(handlers.every(h => h instanceof Function)).toBe(true);
	});
});

describe('clickMiddleware', () => {
	// export const clickMiddleware = store => next => action => {
	// 	if (action.type === CLICK_TRACK_ACTION) {
	// 		appendClick(action);
	// 	}
	// 	return next(action);
	// };
	test('calls appendClick with CLICK_TRACK_ACTIONs', () => {
		const action = {
			type: mockClickState.CLICK_TRACK_ACTION,
		};
		const [store, next] = [{}, () => {}];
		clickMiddleware(store)(next)(action);
		expect(mockClickState.appendClick).toHaveBeenCalledWith(action);
	});
	test('does not call appendClick with arbitrary action', () => {
		const action = { type: 'ghost chips' };
		const [store, next] = [{}, () => {}];
		clickMiddleware(store)(next)(action);
		expect(mockClickState.appendClick).not.toHaveBeenCalledWith(action);
	});
});
