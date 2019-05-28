import JSCookie from 'js-cookie';

/*
 * This module provides utilities for managing click tracking data in a cookie
 */

export const COOKIE_NAME = 'click-track'; // must remain in sync with Meetup Classic implementation

const BrowserCookies = JSCookie.withConverter({
	read: value => decodeURIComponent(value),
	write: value =>
		encodeURIComponent(value).replace(
			/[!'()*]/g,
			c => `%${c.charCodeAt(0).toString(16)}`
		),
});

export const setClickCookie = clickTracking => {
	const domain = window.location.host.replace(/[^.]+/, '').replace(/:\d+/, ''); // strip leading subdomain, e.g. www or beta2 and trailing port
	const cookieVal = JSON.stringify(clickTracking);
	BrowserCookies.set(COOKIE_NAME, cookieVal, { domain });
};
export const getClickCookie = () => BrowserCookies.getJSON(COOKIE_NAME);

export const appendClick = clickData =>
	setClickCookie(reducer(getClickCookie(), clickData));

export const DEFAULT_CLICK_TRACK = { history: [] };

/**
 * @param {Object} data extensible object to store click data {
 *   history: array
 * }
 * @param {Object} action the dispatched action
 * @return {Object} new clickState
 */
export const reducer = (clickState = DEFAULT_CLICK_TRACK, clickData) => ({
	...clickState,
	history: [...clickState.history, clickData],
});
