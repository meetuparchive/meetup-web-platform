/**
 * @param {Object} store Redux store
 * @return {Function} the function that handles calling the next middleware
 *   with each action
 */
const catchMiddleware = store => next => action => {
	try {
		next(action);
	} catch(err) {
		console.error(JSON.stringify({
			err: err.stack,
			message: `Catch middleware - runtime error ${err.message}`,
			info: {
				action,
			},
		}));
		return err;
	}
};

export default catchMiddleware;

