// @flow weak
/**
 * The root level reducer for the app.
 * @module reducer
 **/

import { combineReducers } from 'redux';
import {
	CLICK_TRACK_ACTION,
	CLICK_TRACK_CLEAR_ACTION,
} from '../actions/clickActionCreators';
import {
	API_REQ,
	API_RESP_SUCCESS,
	API_RESP_ERROR,
	API_RESP_FAIL,
	API_RESP_COMPLETE,
} from '../actions/apiActionCreators';
import { CACHE_SUCCESS } from '../actions/cacheActionCreators';

type ApiState = {
	[string]: QueryResponse,
	inFlight: Array<string>,
	fail?: boolean,
};

export const DEFAULT_API_STATE: ApiState = { inFlight: [] };
export const DEFAULT_APP_STATE = {};

type ObjectFilter = (Object, ...args?: Array<any>) => Object;
const filterKeys: ObjectFilter = (obj: ApiState, keys: Array<string>) =>
	Object.keys(obj).reduce(
		(newObj: ApiState, key: string) => {
			if (!keys.includes(key)) {
				newObj[key] = obj[key];
			}
			return newObj;
		},
		{ ...DEFAULT_API_STATE }
	);

export const responseToState = (
	response: QueryResponse
): { [string]: QueryResponse } => ({ [response.ref]: response });

/*
 * The primary reducer for data provided by the API
 */
export function api(
	state: ApiState = DEFAULT_API_STATE,
	action: FluxStandardAction
): ApiState {
	switch (action.type) {
		case API_REQ: {
			const requestRefs = (action.payload || []).map(({ ref }) => ref);
			const inFlight = state.inFlight
				.filter(ref => !requestRefs.includes[ref]) // clean out current duplicates
				.concat(requestRefs); // add new requested refs

			if ((action.meta || {}).logout) {
				// clear app state during logout
				return { ...DEFAULT_API_STATE, inFlight };
			}

			// remove any `ref`s that are being refreshed - eliminate stale data
			const newState = {
				...filterKeys(state, requestRefs),
				inFlight,
			};

			return newState;
		}
		case API_RESP_SUCCESS: // fall though
		case API_RESP_ERROR:
		case CACHE_SUCCESS: // fall through
			// each of these actions provides an API response that should go into app
			// state - error responses will contain error info
			delete state.fail; // if there are any values, the API is not failing
			return {
				...state,
				...responseToState((action.payload || {}).response),
			};
		case API_RESP_FAIL:
			return { ...state, fail: action.payload };
		case API_RESP_COMPLETE: {
			// allways called - clean up inFlight
			const refs = (action.payload || []).map(({ ref }) => ref);
			const inFlight = state.inFlight.filter(ref => !refs.includes(ref));
			return {
				...state,
				inFlight,
			};
		}
		default:
			return state;
	}
}

/**
 * The old API results store
 * @deprecated
 */
export function app(state = DEFAULT_APP_STATE, action = {}) {
	let newState;

	switch (action.type) {
		case 'API_REQUEST':
			if ((action.meta || {}).logout) {
				return DEFAULT_APP_STATE; // clear app state during logout
			}
			return state;
		case 'API_SUCCESS':
			// API_SUCCESS contains an array of responses, but we just need to build a single
			// object to update state with
			newState = action.payload.responses.reduce(
				(s, r) => ({ ...s, ...r }),
				{}
			);
			delete state.error;
			return { ...state, ...newState };
		case 'API_ERROR':
			return {
				...state,
				error: action.payload,
			};
		default:
			return state;
	}
}

export const DEFAULT_CLICK_TRACK = { history: [] };
/**
 * @param {Object} data extensible object to store click data {
 *   history: array
 * }
 * @param {Object} action the dispatched action
 * @return {Object} new state
 */
export function clickTracking(state = DEFAULT_CLICK_TRACK, action) {
	if (action.type === CLICK_TRACK_ACTION) {
		const history = [...state.history, action.payload];
		return {
			...state,
			history,
		};
	}
	if (action.type === CLICK_TRACK_CLEAR_ACTION) {
		return DEFAULT_CLICK_TRACK;
	}
	return state;
}

export function config(state = {}, action) {
	if (action.type === 'CONFIGURE') {
		return { ...state, ...action.payload };
	}
	return state;
}

/**
 * This reducer manages a list of boolean flags that indicate the 'ready to
 * render' state of the application. It is used exclusively by the server,
 * which triggers actions when initializing a response that should eventually
 * make all flags 'true'
 *
 * The server can then read these flags from state and render when ready
 */
export function preRenderChecklist([apiDataLoaded] = [false], action) {
	return [apiDataLoaded || action.type === API_RESP_COMPLETE];
}

const platformReducers = {
	api,
	app,
	clickTracking,
	config,
	preRenderChecklist,
};

/**
 * A function that builds a reducer combining platform-standard reducers and
 * app-specific reducers
 */
export default function makeRootReducer(appReducers = {}) {
	Object.keys(appReducers).forEach(reducer => {
		if (reducer in platformReducers) {
			throw new Error(`'${reducer}' is a reserved platform reducer name`);
		}
	});
	return combineReducers({
		...platformReducers,
		...appReducers,
	});
}
