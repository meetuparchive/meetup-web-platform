// type Epic = (action: Action, store: ReduxStore) => Promise<Array<Action>>
export const createMiddleware = (...epics) => {
	const callEpics = makeCallEpics(...epics);
	return store => next => action => {
		// call all epics with action + store, dispatch immediately as actions get resolved
		callEpics(action, store);
		return next(action);
	};
};
export const makeCallEpics = (...epics) => (action, store) =>
	// using .map here so that tests have access to the Promises that are created
	epics.map(e =>
		e(action, store).then(actions => {
			actions.forEach(a => store.dispatch(a));
		})
	);
