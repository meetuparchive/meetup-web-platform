import { TOAST_MAKE, TOAST_SHOW } from './actions';
export const DEFAULT_TOAST_STATE = { ready: [] };

export const getReadyToasts = state => state.toasts.ready;

export default (toastState = DEFAULT_TOAST_STATE, action) => {
	switch (action.type) {
		case TOAST_MAKE: {
			return { ready: [...toastState.ready, action.payload] };
		}
		case TOAST_SHOW: {
			return { ready: [] };
		}
		default: {
			return toastState;
		}
	}
};
