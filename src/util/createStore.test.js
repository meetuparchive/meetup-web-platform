import createStore, { mergeRawCookies } from './createStore';

const MOCK_ROUTES = {};
const IDENTITY_REDUCER = state => state;
describe('createStore', () => {
	it('creates a store with store functions', () => {
		const basicStore = createStore(MOCK_ROUTES, IDENTITY_REDUCER);
		expect(basicStore.getState).toEqual(jasmine.any(Function));
		expect(basicStore.dispatch).toEqual(jasmine.any(Function));
	});
	it('creates a store with supplied initialState', (done) => {
		const initialState = { foo: 'bar' };
		const basicStore = createStore(MOCK_ROUTES, IDENTITY_REDUCER, initialState);
		basicStore.subscribe(() => {
			expect(basicStore.getState()).toEqual(initialState);
			done();
		});
		basicStore.dispatch({ type: 'dummy' });
	});
	it('applies custom middleware', () => {
		// To determine whether custom middleware is being applied, this test
		// simply spies on the middleware function to see if it's called during
		// store creation

		const spyable = {
			middleware: store => next => action => next(action)
		};
		spyOn(spyable, 'middleware').and.callThrough();
		createStore(
			MOCK_ROUTES,
			IDENTITY_REDUCER,
			null,  // initialState doesn't matter
			[spyable.middleware]
		);
		expect(spyable.middleware).toHaveBeenCalled();
	});

});

describe('mergeRawCookies', () => {
	it('combines request.state cookies with a `__raw_` prefix with the raw request cookie header string', () => {
		const request = {
			state: {
				__raw_foo: 'bar',
				bar: 'baz',  // ignored because it doesn't start with __raw_
			},
			raw: {
				req: {
					headers: {
						cookie: 'foo=bar',
					},
				},
			},
		};
		expect(mergeRawCookies(request)).toEqual('foo=bar; __raw_foo=bar');
	});
});

