import 'rxjs';  // required to enable all Observable operators
import { combineEpics, createEpicMiddleware } from 'redux-observable';

import getSyncEpic from '../epics/sync';
import authEpic from '../epics/auth';
import getCacheEpic from '../epics/cache';
import postEpic from '../epics/post';

/**
 * The middleware is exported as a getter because some of the epics have
 * runtime-configurable dependencies (defaults are used here)
 */
const getPlatformMiddleware = () => createEpicMiddleware(
	combineEpics(
		getSyncEpic(),
		authEpic,
		getCacheEpic(),
		postEpic
	)
);

export default getPlatformMiddleware;

