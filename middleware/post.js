import { bindActionCreators } from 'redux';
import { fetchQueries } from '../util/fetchUtils';

/**
 * PostMiddleware provides a generic interface for triggering POST requests and
 * dispatching particular actions with the API response. The POST action must
 * follow this structure:
 *
 * ```
 * {
 *   type: 'POST',
 *   onSuccess: a callback that takes the API response as an argument, and
 *     returns an action object. The middleware takes care of dispatch
 *   onError: a callback that takes an Error argument and returns an action
 *     object
 * }
 * ```
 *
 * This structure usually allows the success/error handling code to be bundled
 * alongside the POST action creator, with the expectation that all response
 * processing can be done there
 *
 * @module PostMiddleware
 */
const PostMiddleware = store => next => action => {
	const { type, payload } = action;
	if (type.endsWith('_POST') || type.startsWith('POST_')) {
		const {
			query,
			onSuccess,
			onError,
		} = payload;
		const actions = bindActionCreators({
			onSuccess,
			onError,
		}, store.dispatch);

		const {
			config,
			auth,
		} = store.getState();

		fetchQueries(config.apiUrl, { method: 'POST', auth })([query])
			.then(actions.onSuccess)
			.catch(actions.onError);
	}
	return next(action);
};

export default PostMiddleware;
