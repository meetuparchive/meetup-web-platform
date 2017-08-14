// @flow
import type { Middleware } from 'redux';

const catchMiddleware = (
	logError: Error => void
): Middleware<*, FluxStandardAction> => store => next => action => {
	try {
		return next(action);
	} catch (err) {
		logError(err);
		return err;
	}
};

export default catchMiddleware;
