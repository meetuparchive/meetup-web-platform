import { createStore } from 'redux';
import {
	clickTrackEnhancer,
	getPlatformMiddlewareEnhancer,
	getBrowserCreateStore,
	getServerCreateStore
} from './createStore';

const MOCK_ROUTES = {};
const IDENTITY_REDUCER = state => state;
const MOCK_HAPI_REQUEST = {
	state: {}
};

function testCreateStore(createStoreFn) {
	it('creates a store with store functions', () => {
		const basicStore = createStoreFn(IDENTITY_REDUCER);
		expect(basicStore.getState).toEqual(jasmine.any(Function));
		expect(basicStore.dispatch).toEqual(jasmine.any(Function));
	});
	it('creates a store with supplied initialState', (done) => {
		const initialState = { foo: 'bar' };
		const basicStore = createStoreFn(IDENTITY_REDUCER, initialState);
		basicStore.subscribe(() => {
			expect(basicStore.getState()).toEqual(initialState);
			done();
		});
		basicStore.dispatch({ type: 'dummy' });
	});
}

describe('clickTrackEnhancer', () => {
	it('adds event listeners to document.body', () => {
		spyOn(document.body, 'addEventListener');
		const enhancedCreateStore = clickTrackEnhancer(createStore);
		enhancedCreateStore(IDENTITY_REDUCER);
		const args = document.body.addEventListener.calls.allArgs();
		const eventNames = args.map(a => a[0]);
		const handlers = args.map(a => a[1]);

		expect(eventNames).toEqual(['click', 'change']);
		expect(handlers.every(h => h instanceof Function)).toBe(true);
	});
});
describe('getPlatformMiddlewareEnhancer', () => {
	it('applies custom middleware', () => {
		// To determine whether custom middleware is being applied, this test
		// simply spies on the middleware function to see if it's called during
		// store creation

		const spyable = {
			middleware: store => next => action => next(action)
		};
		spyOn(spyable, 'middleware').and.callThrough();
		const platformMiddlewareEnhancer = getPlatformMiddlewareEnhancer(MOCK_ROUTES, [spyable.middleware]);
		const enhancedCreateStore = platformMiddlewareEnhancer(createStore);
		enhancedCreateStore(IDENTITY_REDUCER);
		expect(spyable.middleware).toHaveBeenCalled();
	});
});

describe('getBrowserCreateStore', () => {
	testCreateStore(getBrowserCreateStore(MOCK_ROUTES, []));
});

describe('getServerCreateStore', () => {
	testCreateStore(getServerCreateStore(MOCK_ROUTES, [], MOCK_HAPI_REQUEST));
});
