import Rx from 'rxjs';
import {
	apiSuccess,
	apiError,
} from '../actions/syncActionCreators';
import * as api from '../actions/apiActionCreators';
import { getDeprecatedSuccessPayload } from '../util/fetchUtils';

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

/**
 * get a function that receives a mutation-specific action and returns the
 * corresponding fetch Promise
 *
 * The wrapping function needs current app state in order to apply correct
 * config
 *
 * @param {String} method the desirect HTTP method ('post', 'delete', 'patch')
 * @param {Object} { apiUrl } from state.config
 * @param {Object} postAction, providing query, onSuccess, and onError
 * @return {Promise} results of the fetch, either onSuccess or onError
 */
const getMethodQueryFetch = (method, fetchQueries, store) =>
	query => {
		// force presence of meta.method
		query.meta = { ...(query.meta || {}), method };
		const { config: { apiUrl } } = store.getState();
		return fetchQueries(apiUrl)([query]);
	};

/**
 * Make the mutation call to the API and send the responses to the appropriate
 * places
 *
 * 1. Always send successful mutation responses to API_SUCCESS action
 * 2. If mutation action has an 'onSuccess' action creators, send successful
 *    responses there as well
 * 3. Failed mutation responses will be sent to the mutation action's `onError`
 */
const doFetch$ = fetchQuery => ({ query, onSuccess, onError }) =>
	Rx.Observable.fromPromise(fetchQuery(query))  // make the fetch call
		.flatMap(({ successes, errors }) => {
			const responses = getDeprecatedSuccessPayload(successes, errors);
			console.log(responses);
			const actions = [
				...successes.map(api.success),  // send the successes to success
				...errors.map(api.error),     // send errors to error
				apiSuccess(responses)
			];
			if (onSuccess) {
				actions.push(onSuccess(responses));
			}
			return Rx.Observable.from(actions);
		})
		.catch(err => {
			const actions = [api.fail(err), apiError(err)];
			if (onError) {
				actions.push(onError(err));
			}
			return Rx.Observable.from(actions);
		});

const getMethodEpic = method => fetchQueries => (action$, store) =>
	action$.filter(({ type }) =>
		type.endsWith(`_${method.toUpperCase()}`) || type.startsWith(`${method.toUpperCase()}_`))
		.do(({ type }) => {
			if (process && process.pid) {
				// on the server, render a deprecation warning
				console.warn(`This application is using Post/Delete middleware through ${type}.
See the platform Queries Recipes docs for refactoring options:
https://github.com/meetup/meetup-web-platform/blob/master/docs/Queries.md#recipes`);
			}
		})
		.map(({ payload }) => payload)
		.flatMap(
			doFetch$(
				getMethodQueryFetch(method, fetchQueries, store)
			)
		);

export const getPostEpic = getMethodEpic('post');
export const getDeleteEpic = getMethodEpic('delete');

