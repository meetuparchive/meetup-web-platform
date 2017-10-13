// @flow
import { LOCATION_CHANGE } from 'mwp-router';
import {
	API_REQ,
	API_RESP_SUCCESS,
	API_RESP_ERROR,
	API_RESP_FAIL,
	API_RESP_COMPLETE,
} from './sync/apiActionCreators';
import { CACHE_SUCCESS } from './cache/cacheActionCreators';

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

export const responseToState = (resp: {
	response: QueryResponse,
	query: Query,
}): { [string]: QueryResponse } => ({
	[resp.response.ref]: { ...resp.response, query: resp.query },
});

/*
 * The primary reducer for data provided by the API
 */
export function api(
	state: ApiState = DEFAULT_API_STATE,
	action: FluxStandardAction
): ApiState {
	switch (action.type) {
		case LOCATION_CHANGE: {
			return Object.keys(state).reduce((cleanState, ref) => {
				// throw out data from queries that are not 'GET' - it should not be kept in state
				if (state[ref].query && state[ref].query.meta.method !== 'get') {
					return cleanState;
				}
				return {
					...cleanState,
					[ref]: state[ref],
				};
			}, {});
		}
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
				...responseToState(action.payload || {}),
			};
		case API_RESP_FAIL:
			return { ...state, fail: action.payload };
		case API_RESP_COMPLETE: {
			// always called - clean up inFlight
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
export function app(
	state: { error?: Object } = DEFAULT_APP_STATE,
	action: {
		type: string,
		payload: { responses: Array<Object> },
		error?: Error,
	}
) {
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
