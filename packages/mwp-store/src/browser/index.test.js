import { testCreateStore } from 'mwp-test-utils';

import { getInitialState, getBrowserCreateStore } from './';

const MOCK_ROUTES = {};

// skipping these tests until we set up a jsdom-based test runner for browser s
describe.skip('getBrowserCreateStore', () => {
	global.window = {};
	global.Event = function() {};
	global.document = {
		body: {
			addEventListener() {},
		},
	};
	testCreateStore(getBrowserCreateStore(MOCK_ROUTES, []));
});

describe('getInitialState', () => {
	global.window = {};
	global.Event = function() {};
	global.document = {
		body: {
			addEventListener() {},
		},
	};
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
