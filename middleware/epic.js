import { combineEpics, createEpicMiddleware } from 'redux-observable';

import {
	getNavEpic,
	resetLocationEpic,
	fetchQueriesEpic,
} from '../epics/sync';

const getEpicMiddleware = routes => {
	const navRequestEpic = getNavEpic(routes);
	const rootEpic = combineEpics(
		navRequestEpic,
		resetLocationEpic,
		fetchQueriesEpic
	);

	return createEpicMiddleware(rootEpic);
};

export default getEpicMiddleware;

