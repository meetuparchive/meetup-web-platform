import { CLICK_TRACK_ACTION, appendClick } from './clickState';

// redux middleware to write click state to a cookie on _every_ click.
// this cookie can be consumed by web views rendered by chapstick or web platform apps
export default store => next => action => {
	if (action.type === CLICK_TRACK_ACTION) {
		appendClick(action);
	}
	return next(action);
};
