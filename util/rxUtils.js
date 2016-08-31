import Rx from 'rx';
/**
 * Utilities to help with Observable sequences
 *
 * @module rxUtils
 */

/**
 * utility to log errors and return a curried fallback value
 *
 * @param {Object} errorResponse anything to return in an observable
 * @param {Object} log (optional) A logging function
 * @param {Error} error (in curried return function) The error to handle
 * @returns {Observable} single-element observable
 */
export const catchAndReturn$ = (errorResponse, log) => error => {
	log = log || console.log;
	console.warn(`Error: ${error.message}`);
	log(['error'], error.stack);

	return Rx.Observable.just(errorResponse || { error });
};


