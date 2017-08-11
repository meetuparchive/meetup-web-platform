// @flow
import type { Middleware } from 'redux';
import { API_REQ } from '../api-state'; // mwp-api-state

type PlatformMiddleware = Middleware<*, FluxStandardAction>;

const injectPromise: PlatformMiddleware = store => next => action => {
	if (action.type === API_REQ) {
		action.meta = action.meta || {};
		action.meta.request = new Promise((resolve, reject) => {
			action.meta = action.meta || {};
			action.meta.resolve = resolve;
			action.meta.reject = reject;
		});
	}
	return next(action);
};

export default injectPromise;
