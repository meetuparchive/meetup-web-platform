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
export const filterKeys: ObjectFilter = (
	obj: Object,
	whitelist: Array<string>,
	keys: Array<string>
) =>
	Object.keys(obj).reduce((newObj: Object, key: string) => {
		if (!keys.includes(key) || whitelist.includes(key)) {
			newObj[key] = obj[key];
		}
		return newObj;
	}, {});

type ResponseStateSetter = (
	state: ApiState,
	resp: QueryState
) => { [string]: QueryResponse };

/*
 * Queries can specify 'list' response handling - response values will be
 * stored in a `dyanmicRef` in state. If a `list.merge` param is specified,
 * the response will be merged with the existing list state stored in `dynamicRef`
 */
export const getListState: ResponseStateSetter = (
	state,
	{ response, query }
) => {
	if (!response || !query.list) {
		// no list no problem
		return {};
	}
	const { dynamicRef, merge } = query.list;
	// this query should be treated as a list-building query
	// list can be either a root query result (response.value) or be under `value` field of the result (response.value.value)
	let newList = [];
	if (response.value instanceof Array) {
		newList = response.value;
	} else if (response.value && response.value.value instanceof Array) {
		newList = response.value.value;
	}
	if (!merge) {
		// no merge rules, so just make a new list
		return { [dynamicRef]: { value: newList, query } };
	}

	// do some smart merging
	const { idTest, sort } = merge;
	// remove anything in old list that is part of new list
	const oldList = ((state[dynamicRef] || {}).value || [])
		.filter(valOld => !newList.find(valNew => idTest(valOld, valNew)));

	const mergedList = [...oldList, ...newList];
	// we can omit sort callback e.g. in members search default sort is `closest_match` which we decided not to implement on FE side
	if (sort) {
		mergedList.sort(sort);
	}
	// combine the new list and the old list and sort the results
	return { [dynamicRef]: { value: mergedList } };
};

export const responseToState: ResponseStateSetter = (
	state,
	{ response, query }
) => ({
	[query.ref]: { ...response, query },
	...getListState(state, { response, query }),
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
			const { inFlight, fail, ...refs } = state;
			return Object.keys(refs).reduce(
				(cleanState, ref) => {
					// throw out data from queries that are not 'GET' - it should not be kept in state
					const queryMethod = (state[ref].query.meta || {}).method;
					if (queryMethod && queryMethod !== 'get') {
						return cleanState;
					}
					return {
						...cleanState,
						[ref]: state[ref],
					};
				},
				{ inFlight, fail }
			);
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
			// however, keep any refs whose values are not expected to change
			const refWhitelist = (action.meta || {}).retainRefs || [];
			const newState = {
				...DEFAULT_API_STATE,
				...filterKeys(state, refWhitelist, requestRefs),
				inFlight,
			};

			return newState;
		}
		case API_RESP_SUCCESS: // fall though
		case API_RESP_ERROR:
		case CACHE_SUCCESS: // fall through
			if (!action.payload) {
				throw new Error(`${action.type} dispatched without required payload`);
			}
			// each of these actions provides an API response that should go into app
			// state - error responses will contain error info
			delete state.fail; // if there are any values, the API is not failing
			return {
				...state,
				...responseToState(state, action.payload),
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
		meta?: any,
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
