// @flow
export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';
export const SERVER_RENDER = '@@router/INITIAL_RENDER';

export function locationChange(location: LocationShape): LocationAction {
	return {
		type: LOCATION_CHANGE,
		payload: location,
	};
}
