/**
 * @param {Object} store Redux store
 * @return {Function} the function that handles calling the next middleware
 *   with each action
 */
const catchMiddleware = store => next => action => {
	try {
		next(action);
	} catch(err) {
		console.error(err);
		return err;
	}
};

export default catchMiddleware;

