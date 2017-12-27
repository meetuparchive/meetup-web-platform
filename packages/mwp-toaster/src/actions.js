// @flow
export const TOAST_MAKE = 'TOAST_MAKE';
export const TOAST_SHOW = 'TOAST_SHOW';
export const TOAST_DISMISS = 'TOAST_DISMISS';

type ToastProps = {
	action?: (event: Event) => void, // onClick handler
	actionLabel?: React$Element<*>,
	dismissable?: boolean,
	autodismiss?: boolean,
};

export const makeToast = (payload: ToastProps) => ({
	type: TOAST_MAKE,
	payload,
});

export const showToasts = () => ({ type: TOAST_SHOW });
