import Rx from 'rxjs';
import {
	apiSuccess,
	apiError,
} from '../actions/syncActionCreators';
import * as api from '../actions/apiActionCreators';
import { getDeprecatedSuccessPayload } from '../util/fetchUtils';

/**
 * PostEpic provides a generic interface for triggering POST requests and
 * dispatching particular actions with the API response. The POST action must
 * follow this structure:
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
 * alongside the POST action creator, with the expectation that all response
 * processing can be done there
 *
 * @module PostEpic
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
const getMethodQueryFetch = method => (fetchQueries, store) =>
	query => {
		// force presence of meta.method
		query.meta = { ...(query.meta || {}), method };
		const { config: { apiUrl } } = store.getState();
		return fetchQueries(apiUrl)([query]);
	};

const getPostQueryFetch = getMethodQueryFetch('post');
const getDeleteQueryFetch = getMethodQueryFetch('delete');

/**
 * Make the POST call to the API and send the responses to the appropriate
 * places
 *
 * 1. Always send successful post responses to API_SUCCESS action
 * 2. If POST action has an 'onSuccess' action creators, send successful
 *    responses there as well
 * 3. Failed POST responses will be sent to the POST action's `onError`
 */
const doFetch$ = fetchQuery => ({ query, onSuccess, onError }) =>
	Rx.Observable.fromPromise(fetchQuery(query))  // make the fetch call
		.flatMap(({ successes, errors }) => {
			const responses = getDeprecatedSuccessPayload(successes, errors);
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

export const getPostEpic = fetchQueries => (action$, store) =>
	action$.filter(({ type }) => type.endsWith('_POST') || type.startsWith('POST_'))
		.map(({ payload }) => payload)
		.flatMap(
			doFetch$(
				getPostQueryFetch(fetchQueries, store)
			)
		);

export const getDeleteEpic = fetchQueries => (action$, store) =>
	action$.filter(({ type }) => type.endsWith('_DELETE') || type.startsWith('DELETE_'))
		.map(({ payload }) => payload)
		.flatMap(
			doFetch$(
				getDeleteQueryFetch(fetchQueries, store)
			)
		);

