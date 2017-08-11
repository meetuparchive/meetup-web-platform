import { combineEpics, createEpicMiddleware } from 'redux-observable';

import getSyncEpic from './sync';
import getCacheEpic from './cache';
import { postEpic, deleteEpic } from './mutate'; // DEPRECATED

// export specific values of internal modules
export {
	LOCATION_CHANGE,
	SERVER_RENDER,
	locationChange,
} from './sync/syncActionCreators';
export {
	API_REQ,
	API_RESP_SUCCESS,
	API_RESP_COMPLETE,
	API_RESP_ERROR,
	API_RESP_FAIL,
	requestAll,
	get,
	post,
	patch,
	del,
} from './sync/apiActionCreators';
export { api, app } from './reducer';

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to set up the nav-related epic(s) that are part of the
 * final middleware
 *
 * **Note** it's unlikely that the server needs any epics other than `sync` in
 * order to render the application. We may want to write a server-specific
 * middleware that doesn't include the other epics if performance is an issue
 */
export const getApiMiddleware = (routes, fetchQueries, baseUrl) =>
	createEpicMiddleware(
		combineEpics(
			getSyncEpic(routes, fetchQueries, baseUrl),
			getCacheEpic(),
			postEpic, // DEPRECATED
			deleteEpic // DEPRECATED
		)
	);
