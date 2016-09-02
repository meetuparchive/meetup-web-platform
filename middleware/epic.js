import { combineEpics, createEpicMiddleware } from 'redux-observable';

import {
	getNavEpic,
	resetLocationEpic,
	fetchQueriesEpic,
} from '../epics/sync';

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to sync correctly.
 *
 * The middleware itself - passes the queries to the application server, which
 * will make necessary calls to the API
 */

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

