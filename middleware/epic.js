import { combineEpics, createEpicMiddleware } from 'redux-observable';

import {
	getNavQueriesEpic,
	authResetEpic,
	apiRequestEpic,
} from '../epics/sync';

const getEpicMiddleware = routes => {
	const navRequestEpic = getNavQueriesEpic(routes);
	const rootEpic = combineEpics(
		navRequestEpic,
		authResetEpic,
		apiRequestEpic
	);

	return createEpicMiddleware(rootEpic);
};

export default getEpicMiddleware;

