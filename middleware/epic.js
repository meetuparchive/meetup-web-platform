import { combineEpics, createEpicMiddleware } from 'redux-observable';

import getSyncEpic from '../epics/sync';

const getEpicMiddleware = routes => {
	const syncEpic = getSyncEpic(routes);
	const rootEpic = combineEpics(
		syncEpic
	);

	return createEpicMiddleware(rootEpic);
};

export default getEpicMiddleware;

