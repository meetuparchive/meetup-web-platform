export const CLICK_TRACK_ACTION = 'CLICK_TRACK';

export const click = clickData => ({
	type: CLICK_TRACK_ACTION,
	payload: clickData,
});

