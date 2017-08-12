/**
 * @param {Object} store Redux store
 * @return {Function} the function that handles calling the next middleware
 *   with each action
 */
const catchMiddleware = logError => store => next => action => {
	try {
		return next(action);
	} catch (err) {
		logError(err);
		return err;
	}
};

export default catchMiddleware;
