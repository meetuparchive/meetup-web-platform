// @flow

import { createSelector } from 'reselect';

export const EMPTY_OBJ = {};
export const EMPTY_ARR = [];

/*
 * Checks a query response object for an error prop and the response if there
 * are errors, or an empty object if no errors are found.
 *
 * **NOTES**
 * - this function will _always return an object_ - use `processErrorsMaybe` or
 *   `hasErrors` if you want a falsey return value.
 * - There might still be errors in the `resp.value` that correspond to
 *   particular errors in the request - those will not be flagged by this
 *   function, only top-level errors in `resp.error`, such as a general 'Bad
 *   Request' error message.
 */
export const processErrors = (
	resp: ?QueryResponse
): QueryResponse | typeof EMPTY_OBJ => {
	if (!resp || !resp.error) {
		return EMPTY_OBJ;
	}
	return resp;
};

/*
 * Similar to `processErrors`, but will return `null` if no errors are found
 */
export const processErrorsMaybe = (responseValue: ?QueryResponse) => {
	const processed = processErrors(responseValue);
	return Object.keys(processed).length > 0 ? processed : null;
};

// Checks if state argument is falsey or an empty object
export const isEmpty: Selector<boolean> = state => {
	if (!state) {
		return true;
	}
	return Object.keys(state).length === 0;
};

// Checks if object has errors
export const hasErrors: Selector<boolean> = state =>
	Boolean(processErrorsMaybe);

// Combo check if the object is either empty or has errors
export const hasValidValue: Selector<boolean> = state =>
	!isEmpty(state) && !hasErrors(state);

/*
 * returns the QueryResponse.value, or an object containing a single `error`
 * property. An empty response returns the defaultValue.
 *
 * TODO: clean up and clarify the behavior of this function - the mixed return
 *       type is hard to reason about (default, unchanged resp, or resp.value).
 */
export const getValue = (
	resp: ?QueryResponse,
	defaultValue: mixed = EMPTY_OBJ
): mixed => {
	if (!resp || isEmpty(resp)) {
		return defaultValue;
	}
	if (resp.error) {
		return resp; // this is an object like { error, meta }
	}
	return resp.value; // the 'unwrapped' value
};

/*
 * Returns a property from response.value in state if available with no errors.
 * If response.error or response is empty, returns default value
 *
 * TODO: clean up and clarify the behavior of this function - the mixed return
 *       type is hard to reason about (default, unchanged resp, or resp.value).
 */
export const getProperty = (
	resp: ?QueryResponse,
	prop: string,
	defaultValue: mixed = EMPTY_OBJ
): mixed => {
	const value = getValue(resp, defaultValue);

	if (value === defaultValue || !(value instanceof Object)) {
		return defaultValue;
	}
	return value.error ? value : value[prop] || defaultValue;
};

/*
 * creates a function that reads from the state object provided using an
 * optional selector, or, if state is empty, returns the provided default value.
 * 
 * Whn no selector is provided, state will be returned directly.
 */
export const getSelectOrFallback = (
	defaultValue: mixed,
	selector: Selector<mixed> = s => s
) => (state: ?Object) => {
	if (isEmpty(state)) {
		return defaultValue;
	}
	return selector(state);
};

// selects the inFlight part of state
const getInFlightResp = state => state.api.inFlight;

export const getInFlight = createSelector(
	getInFlightResp,
	getSelectOrFallback(EMPTY_ARR)
);

// Reads response and builds a custom error object based on response.error
export const getResponse = (
	resp: ?QueryResponse,
	type: string,
	defaultValue: mixed = EMPTY_OBJ
) => {
	if (!resp || isEmpty(resp)) {
		return defaultValue;
	}

	if (resp.error) {
		return {
			error: { type, message: resp.error },
		};
	}

	return resp.value;
};
