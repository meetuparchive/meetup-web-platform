export const CLICK_TRACK_ACTION = 'CLICK_TRACK';
export const CLICK_TRACK_CLEAR_ACTION = 'CLICK_TRACK_CLEAR';

export const actions = {
	click: clickData => ({
		type: CLICK_TRACK_ACTION,
		payload: clickData,
	}),
	clear: () => ({ type: CLICK_TRACK_CLEAR_ACTION }),
};

export const DEFAULT_CLICK_TRACK = { history: [] };
/**
 * @param {Object} data extensible object to store click data {
 *   history: array
 * }
 * @param {Object} action the dispatched action
 * @return {Object} new state
 */
export function reducer(state = DEFAULT_CLICK_TRACK, action) {
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
