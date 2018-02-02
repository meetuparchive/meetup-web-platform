import { createEpicMiddleware, combineEpics } from './redux-promise-epic';

import getSyncEpic from './sync';
import getCacheEpic from './cache';
import { postEpic, deleteEpic } from './mutate'; // DEPRECATED

// export specific values of internal modules
export {
	API_REQ,
	API_RESP_SUCCESS,
	API_RESP_COMPLETE,
	API_RESP_ERROR,
	API_RESP_FAIL,
	get,
	post,
	patch,
	del,
} from './sync/apiActionCreators';
export { api, app, DEFAULT_API_STATE } from './reducer';

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to set up the nav-related epic(s) that are part of the
 * final middleware
 *
 * **Note** it's unlikely that the server needs any epics other than `sync` in
 * order to render the application. We may want to write a server-specific
 * middleware that doesn't include the other epics if performance is an issue
 */
export const getApiMiddleware = (resolveRoutes, fetchQueriesFn) =>
	createEpicMiddleware(
		combineEpics(
			getCacheEpic(),
			getSyncEpic(resolveRoutes, fetchQueriesFn),
			postEpic, // DEPRECATED
			deleteEpic // DEPRECATED
		)
	);
