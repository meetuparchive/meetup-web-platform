import Rx from 'rxjs';
import {
	apiSuccess
} from '../actions/syncActionCreators';
/**
 * DeleteEpic provides a generic interface for triggering DELETE requests and
 * dispatching particular actions with the API response. The DELETE action must
 * follow this structure:
 *
 * ```
 * {
 *   type: 'DELETE_<SOMETHING>' (or '<SOMETHING>_DELETE'),
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
 * alongside the DELETE action creator, with the expectation that all response
 * processing can be done there
 *
 * @module DeleteEpic
 */

/**
 * get a function that receives a post action and returns the corresponding
 * fetch Promise
 *
 * The wrapping function needs current app state in order to apply correct
 * config
 *
 * @param {Object} { apiUrl } from state.config
 * @param {Object} deleteAction, providing query, onSuccess, and onError
 * @return {Promise} results of the fetch, either onSuccess or onError
 */
const getDeleteQueryFetch = (fetchQueries, store) =>
	query => {
		const { config: { apiUrl } } = store.getState();
		return fetchQueries(apiUrl, { method: 'DELETE' })([query]);
	};

/**
 * Make the DELETE call to the API and send the responses to the appropriate
 * places
 *
 * 1. Always send successful delete responses to API_SUCCESS action
 * 2. If DELETE action has an 'onSuccess' action creators, send successful
 *    responses there as well
 * 3. Failed DELETE responses will be sent to the DELETE action's `onError`
 */
const doDelete$ = fetchDeleteQuery => ({ query, onSuccess, onError }) =>
	Rx.Observable.fromPromise(fetchDeleteQuery(query))  // make the fetch call
		.flatMap(responses =>
			// success! return API_SUCCESS and whatever the DELETE action wants to do onSuccess
			Rx.Observable.of(
				apiSuccess(responses),
				onSuccess && onSuccess(responses)
			)
		)
		.catch(err => Rx.Observable.of(onError(err)));

const getDeleteEpic = fetchQueries => (action$, store) =>
	action$.filter(({ type }) => type.endsWith('_DELETE') || type.startsWith('DELETE_'))
		.map(({ payload }) => payload)
		.flatMap(
			doDelete$(
				getDeleteQueryFetch(fetchQueries, store)
			)
		);

export default getDeleteEpic;
