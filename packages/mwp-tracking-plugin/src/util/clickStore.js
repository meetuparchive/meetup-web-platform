import { CLICK_TRACK_ACTION, appendClick } from './clickState';
import getClickParser from './clickParser';

// redux middleware to write click state to a cookie on _every_ click.
// this cookie can be consumed by web views rendered by chapstick or web platform apps
export const clickMiddleware = store => next => action => {
	if (action.type === CLICK_TRACK_ACTION) {
		appendClick(action);
	}
	return next(action);
};

const parseClick = getClickParser();

export const clickTrackEnhancer = createStore => (
	reducer,
	initialState,
	enhancer
) => {
	const store = createStore(reducer, initialState, enhancer);
	const clickTracker = e => {
		setTimeout(() => store.dispatch(parseClick(e)), 0);
	};
	document.body.addEventListener('click', clickTracker);
	document.body.addEventListener('change', clickTracker);

	return store;
};
