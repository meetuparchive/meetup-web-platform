import { fetchQueries } from '../util/fetchUtils';

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
 * get a function that receives a post action and returns the corresponding
 * fetch Promise
 *
 * The wrapping function needs a store so that the returned function can
 * read from state
 *
 * @param {Redux Store} store
 * @param {Object} postAction, providing query, onSuccess, and onError
 * @return {Promise} results of the fetch, either onSuccess or onError
 */
const getPostActionFetch = ({ getState }) =>
	({ type, payload: { query, onSuccess, onError }}) => {
		const {
			config,
		} = getState();
		const fetchOpts = { method: 'POST', csrf: config.csrf };

		return fetchQueries(config.apiUrl, fetchOpts)([query])
			.then(onSuccess)
			.catch(onError);
	};

const PostEpic = (action$, store) =>
	action$.filter(({ type })=> type.endsWith('_POST') || type.startsWith('POST_'))
		.flatMap(getPostActionFetch(store));

export default PostEpic;
