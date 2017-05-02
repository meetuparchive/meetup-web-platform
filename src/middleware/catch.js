/**
 * @param {Object} store Redux store
 * @return {Function} the function that handles calling the next middleware
 *   with each action
 */
const catchMiddleware = store => next => action => {
	try {
		return next(action);
	} catch(err) {
		if (typeof window === 'undefined') {
			console.error(JSON.stringify({
				err: err.stack,
				message: `Catch middleware - runtime error ${err.message}`,
				info: {
					action,
				},
			}));
		} else {
			console.error(err);
		}
		return err;
	}
};

export default catchMiddleware;

