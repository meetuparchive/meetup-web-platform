// @flow

import { createSelector } from 'reselect';

export const EMPTY_OBJ = {};
export const EMPTY_AR = [];

/**
 * Checks a response object for errors and returns them
 * @param  {Object} responseValue Response value from Api
 * @return {Object} an object containing errors parsed from the response
 */
export const processErrors = (responseValue: ?QueryResponse): Object => {
	if (!responseValue || !responseValue.error) {
		return {};
	}
	return responseValue;
};

export const processErrorsMaybe = (responseValue: ?QueryResponse) => {
	const processed = processErrors(responseValue);
	return Object.keys(processed).length ? processed : null;
};

// Checks if object is empty
export const isEmpty: Selector<boolean> = state => {
	if (!state) {
		return true;
	}
	return Object.keys(state).length === 0;
};

// Checks if object is has errors
export const hasErrors: Selector<boolean> = state =>
	Object.keys(processErrors(state)).length > 0;

// Combo check if the object is either empty or has errors
export const hasValidValue: Selector<boolean> = state =>
	!isEmpty(state) && !hasErrors(state);

/*
 * returns the QueryResponse.value, or an object containing a single `error`
 * property. An empty response returns the defaultValue.
 */
export const getValue = (
	resp: ?QueryResponse,
	defaultValue: mixed = EMPTY_OBJ
): mixed => {
	if (!resp || isEmpty(resp)) {
		return defaultValue;
	}
	if (hasErrors(resp)) {
		return resp; // this is an object like { error, meta }
	}
	return resp.value; // the 'unwrapped' value
};

/**
 * Returns a property from response.value in state. If response.error or
 * response is empty, returns default value
 */
export const getProperty = (
	resp: ?QueryResponse,
	prop: string,
	defaultValue: mixed = EMPTY_OBJ
): mixed => {
	const value = getValue(resp, defaultValue);

	if (value === defaultValue || value.error) {
		return value;
	}
	if (value instanceof Object && value[prop]) {
		return value[prop];
	}

	return defaultValue;
};

/**
 * Pulls the value out of the state object provided or if error returns default value
 * @param  {Object}  defaultValue    fallback value if value is inValid
 * @param  {Object}  selector    selector to be pulled off state object
 * @return {Object}  returns selected value
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
	getSelectOrFallback(EMPTY_AR, resp => resp)
);

// Reads response and builds error object based on response.error
export const getResponse = (
	resp: ?QueryResponse,
	type: string,
	defaultValue: mixed = EMPTY_OBJ
) => {
	// empty check
	if (!resp || isEmpty(resp)) {
		return defaultValue;
	}
	// error object
	if (resp.error) {
		return {
			error: {
				type,
				message: resp.error,
			},
		};
	}

	return resp.value;
};
