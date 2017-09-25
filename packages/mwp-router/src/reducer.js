// @flow
import { LOCATION_CHANGE, SERVER_RENDER } from './routeActionCreators';
/*
 * Store routing state to allow middleware to record more accurate
 * tracking info
 */
export default function routing(
	state: { location?: LocationShape, referrer?: LocationShape | {} } = {},
	action: LocationAction
) {
	if (action.type === LOCATION_CHANGE || action.type === SERVER_RENDER) {
		return {
			referrer: state.location || {},
			location: action.payload,
		};
	}
	return state;
}
