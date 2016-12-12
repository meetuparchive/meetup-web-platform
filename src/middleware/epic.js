require('rxjs');  // required to enable all Observable operators in subsequent imports

const getSyncEpic = require('../epics/sync').default;
const getCacheEpic = require('../epics/cache').default;
const getPostEpic = require('../epics/post').default;

const {
	combineEpics,
	createEpicMiddleware,
} = require('redux-observable');

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to set up the nav-related epic(s) that are part of the
 * final middleware
 *
 * **Note** it's unlikely that the server needs any epics other than `sync` in
 * order to render the application. We may want to write a server-specific
 * middleware that doesn't include the other epics if performance is an issue
 */
const getPlatformMiddleware = (routes, fetchQueries) => createEpicMiddleware(
	combineEpics(
		getSyncEpic(routes, fetchQueries),
		getCacheEpic(),
		getPostEpic(fetchQueries)
	)
);

export default getPlatformMiddleware;

