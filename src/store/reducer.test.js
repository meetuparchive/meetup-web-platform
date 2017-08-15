import * as redux from 'redux';
import makeRootReducer, { platformReducers } from './reducer';
/**
 * A function that builds a reducer combining platform-standard reducers and
 * app-specific reducers
export default function makeRootReducer(appReducers = {}) {
	Object.keys(appReducers).forEach(reducer => {
		if (reducer in platformReducers) {
			throw new Error(`'${reducer}' is a reserved platform reducer name`);
		}
	});
	return combineReducers({
		...platformReducers,
		...appReducers,
	});
}
*/
redux.combineReducers = jest.fn();

describe('makeRootReducer', () => {
	it('calls combineReducers with platform reducers + supplied reducers', () => {
		redux.combineReducers.mockClear();
		const foo = () => {};
		const appReducers = { foo };
		makeRootReducer(appReducers);
		expect(redux.combineReducers).toHaveBeenCalled();
		const calledWith = redux.combineReducers.mock.calls[0][0];
		expect(calledWith).toMatchObject(platformReducers); // all platform reducers
		expect(calledWith).toMatchObject(appReducers); // additional app reducer
	});

	it('throws error when attempting to overwrite a platform reducer', () => {
		const invalidReducerKey = Object.keys(platformReducers)[0];
		expect(() =>
			makeRootReducer({
				[invalidReducerKey]: platformReducers[invalidReducerKey],
			})
		).toThrow();
	});
});
