import 'rxjs';  // required to enable all Observable operators
import { combineEpics, createEpicMiddleware } from 'redux-observable';

import getSyncEpic from '../epics/sync';
import getCacheEpic from '../epics/cache';
import {
	getPostEpic,
	getDeleteEpic
} from '../epics/mutate';

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to set up the nav-related epic(s) that are part of the
 * final middleware
 *
 * **Note** it's unlikely that the server needs any epics other than `sync` in
 * order to render the application. We may want to write a server-specific
 * middleware that doesn't include the other epics if performance is an issue
 */
const getPlatformMiddleware = (routes, fetchQueries, baseUrl) => createEpicMiddleware(
	combineEpics(
		getSyncEpic(routes, fetchQueries, baseUrl),
		getCacheEpic(),
		getPostEpic(fetchQueries),
		getDeleteEpic(fetchQueries)
	)
);

export default getPlatformMiddleware;

