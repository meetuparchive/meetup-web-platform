import * as api from '../actions/apiActionCreators';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

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

const getMethodEpic = method => action$ =>
	action$
		.filter(
			({ type }) =>
				type.endsWith(`_${method.toUpperCase()}`) ||
				type.startsWith(`${method.toUpperCase()}_`)
		)
		.do(({ type }) => {
			// Webpack will make sure process.env.NODE_ENV is populated on client
			if (process.env.NODE_ENV !== 'production') {
				// using a dev endpoint, render a deprecation warning
				console.warn(
					`This application is using Post/Delete middleware through ${type}.
See the platform Queries Recipes docs for refactoring options:
https://github.com/meetup/meetup-web-platform/blob/master/docs/Queries.md#recipes`
				);
			}
		})
		.map(({ payload: { query, onSuccess, onError } }) => ({
			query,
			meta: { onSuccess, onError },
		}))
		.map(({ query, meta }) => {
			const actionCreator = method === 'delete' ? 'del' : method;
			return api[actionCreator](query, meta);
		});

export const postEpic = getMethodEpic('post');
export const deleteEpic = getMethodEpic('delete');
