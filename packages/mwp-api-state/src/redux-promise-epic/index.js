// type Epic = (action: Action, store: ReduxStore) => Promise<Array<Action>>
export const createEpicMiddleware = epic => {
	return store => next => action => {
		epic(action, store).then(actions => {
			actions.forEach(a => store.dispatch(a));
		});
		return next(action);
	};
};
