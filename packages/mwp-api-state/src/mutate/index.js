import * as api from '../sync/apiActionCreators';

/**
 * Mutate epic  provides a generic interface for triggering POST and DELETE requests
 * and dispatching particular actions with the API response. The POST or DELETE action
 * must follow this structure:
 *
 * ```
 * {
 *   type: 'POST_<SOMETHING>' (or '<SOMETHING>_POST'),
 *   payload: {
 *     query: a 'reactive query' object that maps to an API call,
 *     onSuccess: a callback that takes the API response as an argument, and
 *       returns an action object. The middleware takes care of dispatch
 *     onError: a callback that takes an Error argument and returns an action
 *       object
 *   }
 * }
 * ```
 *
 * This structure usually allows the success/error handling code to be bundled
 * alongside the POST/DELETE action creator, with the expectation that all response
 * processing can be done there
 *
 * @deprecated
 * @module MutateEpic
 */

/*
 * Delegate method-specific request actions (e.g. 'POST_MY_FORM') to the sync
 * middleware by modifying the request actions' query payloads to include
 * request method properties
 * @deprecated
 */
const _getMethodEpic = method => {
	const matchAction = ({ type }) =>
		type.endsWith(`_${method.toUpperCase()}`) ||
		type.startsWith(`${method.toUpperCase()}_`);

	return action => {
		if (!matchAction(action)) {
			return Promise.resolve([]);
		}
		const { type, payload: { query, onSuccess, onError } } = action;
		// Webpack will make sure process.env.NODE_ENV is populated on client
		if (process.env.NODE_ENV !== 'production') {
			// using a dev endpoint, render a deprecation warning
			console.warn(
				`This application is using Post/Delete middleware through ${type}.
	See the platform Queries Recipes docs for refactoring options:
	https://github.com/meetup/meetup-web-platform/blob/master/docs/Queries.md#recipes`
			);
		}
		const actionCreator = method === 'delete' ? 'del' : method;
		const meta = { onSuccess, onError };
		return Promise.resolve([api[actionCreator](query, meta)]);
	};
};

export const postEpic = _getMethodEpic('post');
export const deleteEpic = _getMethodEpic('delete');
