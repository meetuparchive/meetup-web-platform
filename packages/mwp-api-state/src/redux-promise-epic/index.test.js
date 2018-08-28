import { makeCallEpics } from './index';

describe('makeCallEpics', () => {
	test('every epic calls store.dipatch', () => {
		const store = { dispatch: jest.fn() };
		const epics = [
			() => Promise.resolve(['action1']),
			() => Promise.resolve(['action2']),
			() => Promise.resolve(['action3']),
		];

		const callEpics = makeCallEpics(...epics);
		return Promise.all(callEpics('foo', store)).then(() => {
			expect(store.dispatch.mock.calls).toMatchSnapshot();
		});
	});
	test('delayed actions arrive later', () => {
		const store = { dispatch: jest.fn() };
		const delayedAction = 'action0';
		const delayedEpic = () =>
			new Promise(resolve => setTimeout(() => resolve([delayedAction]), 5));
		const epics = [
			delayedEpic,
			() => Promise.resolve(['action1']),
			() => Promise.resolve(['action2']),
			() => Promise.resolve(['action3']),
		];

		const callEpics = makeCallEpics(...epics);
		return Promise.all(callEpics('foo', store)).then(() => {
			expect(store.dispatch).toHaveBeenLastCalledWith(delayedAction);
		});
	});
});
