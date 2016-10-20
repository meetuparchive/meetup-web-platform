import 'rxjs';  // required to enable all Observable operators
import { combineEpics, createEpicMiddleware } from 'redux-observable';

import getSyncEpic from '../epics/sync';
import authEpic from '../epics/auth';
import getCacheEpic from '../epics/cache';
import postEpic from '../epics/post';

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to set up the nav-related epic(s) that are part of the
 * final middleware
 */
const getPlatformMiddleware = createEpicMiddleware(
	combineEpics(
		getSyncEpic(),
		authEpic,
		getCacheEpic(),
		postEpic
	)
);

export default getPlatformMiddleware;

