// type Epic = (action: Action, store: ReduxStore) => Promise<Array<Action>>
export const createEpicMiddleware = epic => {
	return store => next => action => {
		// need to execute epics in the next tick in order to ensure that that state
		// has been updated by reducers
		Promise.resolve().then(() =>
			epic(action, store).then(actions => {
				actions.forEach(a => store.dispatch(a));
			})
		);
		return next(action);
	};
};

const flattenArray = arrays => [].concat.apply([], arrays);
export const combineEpics = (...epics) => (action, store) =>
	Promise.all(epics.map(e => e(action, store))).then(flattenArray);
