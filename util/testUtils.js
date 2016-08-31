import TestUtils from 'react-addons-test-utils';

export function findComponentsWithType(tree, typeString) {
	return TestUtils.findAllInRenderedTree(
		tree,
		(component) => component && component.constructor.name === typeString
	);
}

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

export const middlewareDispatcher = middleware => (storeData, action) => {
	let dispatched = null;
	const dispatch = middleware(createFakeStore(storeData))(actionAttempt => dispatched = actionAttempt);
	dispatch(action);
	return dispatched;
};

