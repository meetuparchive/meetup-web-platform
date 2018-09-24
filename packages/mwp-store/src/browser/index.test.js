import { createStore } from 'redux';
import { testCreateStore } from 'mwp-test-utils';

import { clickTrackEnhancer, getInitialState, getBrowserCreateStore } from './';

const MOCK_ROUTES = {};
const IDENTITY_REDUCER = state => state;

describe('clickTrackEnhancer', () => {
	global.window = {};
	global.Event = function() {};
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

describe('getBrowserCreateStore', () => {
	testCreateStore(getBrowserCreateStore(MOCK_ROUTES, []));
});

describe('getInitialState', () => {
	const injectedState = { foo: 'bar' };
	global.document.createElement = jest.fn(() => {
		return {
			set innerHTML(stateJSON) {
				const state = JSON.parse(stateJSON);
				this.textContent = JSON.stringify({ ...injectedState, ...state });
			},
		};
	});
	it('returns "unescaped" APP_RUNTIME.escapedState', () => {
		const state = { baz: 'qux' };
		const APP_RUNTIME = { escapedState: JSON.stringify(state) };
		expect(getInitialState(APP_RUNTIME)).toEqual({
			...injectedState,
			...state,
		});
	});
});
