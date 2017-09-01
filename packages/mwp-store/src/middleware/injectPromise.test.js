import { requestAll } from 'mwp-api-state'; // mwp-api-state
import injectPromise from './injectPromise';

describe('injectPromise middleware', () => {
	const getAction = () => requestAll([]);
	const processAction = injectPromise(undefined)(() => {});
	test('modifies API_REQ with a meta.request Promise', () => {
		const action = getAction();
		processAction(action);
		expect(action.meta.request).toEqual(expect.any(Promise));
	});
	test('meta.resolve will resolve the meta.request Promise', () => {
		const action = getAction();
		processAction(action);
		expect(action.meta.resolve).toEqual(expect.any(Function));
		const resolveHandler = jest.fn();
		action.meta.resolve();
		return action.meta.request.then(resolveHandler).then(() => {
			expect(resolveHandler).toHaveBeenCalled();
		});
	});
	test('meta.reject will reject the meta.request Promise', () => {
		const action = getAction();
		processAction(action);
		expect(action.meta.reject).toEqual(expect.any(Function));
		const rejectHandler = jest.fn();
		action.meta.reject();
		return action.meta.request.catch(rejectHandler).then(() => {
			expect(rejectHandler).toHaveBeenCalled();
		});
	});
	test('does not modify a non-API_REQ action', () => {
		const meta = { foo: 'bar', baz: 'qux' };
		const action = { type: 'foo', meta };
		processAction(action);
		expect(action.meta).toEqual(meta);
	});
});
