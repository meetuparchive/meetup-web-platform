export const CLICK_TRACK_ACTION = 'CLICK_TRACK';
export const CLICK_TRACK_CLEAR_ACTION = 'CLICK_TRACK_CLEAR';

export const click = clickData => ({
	type: CLICK_TRACK_ACTION,
	payload: clickData,
});

export const clearClick = () => ({ type: CLICK_TRACK_CLEAR_ACTION });
