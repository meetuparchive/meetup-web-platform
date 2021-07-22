import querystring from 'qs';
import config from 'mwp-config';
const appConfig = config.getServer().properties;

const PREFERRED_TIMEZONE_COOKIE = 'MEETUP_PREFERRED_TIMEZONE';

export const MEMBER_COOKIE = appConfig.api.isProd
	? 'MEETUP_MEMBER'
	: 'MEETUP_MEMBER_DEV';

export const BROWSER_ID_COOKIE = appConfig.api.isProd
	? 'MEETUP_BROWSER_ID'
	: 'MEETUP_BROWSER_ID_DEV';

// SIFT_SESSION_ID cookie created in fastly and used by sift science to correlate spammy
// behavior to user activity; cookie has an expiration time of 4 hours and should be
// reset on logout. For more details please refer  https://sift.com/resources/tutorials/anonymous-users
export const SIFT_SESSION_COOKIE = appConfig.api.isProd
	? 'SIFT_SESSION_ID'
	: 'SIFT_SESSION_ID_DEV';

export const parseMemberCookie = state => {
	if (!state[MEMBER_COOKIE]) {
		// no member cookie - this is only possible for 'internal' requests, e.g. health checks.
		// always return id=0 to keep basic member object valid
		return { id: 0 };
	}
	const member = querystring.parse(state[MEMBER_COOKIE]);
	member.id = parseInt(member.id, 10) || 0;
	return member;
};

export const parsePreferredTimeZoneCookie = state => {
	if (!state[PREFERRED_TIMEZONE_COOKIE]) {
		return '';
	}
	const preferredTimeZone = querystring.parse(state[PREFERRED_TIMEZONE_COOKIE]);

	if (
		typeof preferredTimeZone === 'object' &&
		Object.keys(preferredTimeZone).length &&
		typeof Object.keys(preferredTimeZone)[0] === 'string' &&
		Object.keys(preferredTimeZone)[0].length
	) {
		return Object.keys(preferredTimeZone)[0];
	}
	return '';
};

export const parseLocationRedirect = state => {
	if (!state.locationRedirect) {
		return '';
	}

	return querystring.parse(state.locationRedirect);
};

export const parseBrowserIdCookie = state => {
	if (!state[BROWSER_ID_COOKIE]) {
		return { id: '' };
	}
	const browserId = querystring.parse(state[BROWSER_ID_COOKIE]);
	return browserId;
};

export const parseSiftSessionCookie = state => state[SIFT_SESSION_COOKIE] || '';

/*
 * Some variant settings can be passed in from MEETUP_VARIANT_XXX cookies. This
 * function reads those cookie values from `state` and returns a map of values
 */
export const getVariants = state =>
	Object.keys(state).reduce((variants, cookieName) => {
		const isEnvCookie = !(appConfig.api.isProd ^ !cookieName.endsWith('_DEV')); // XNOR - both conditions or neither condition
		if (cookieName.startsWith('MEETUP_VARIANT_') && isEnvCookie) {
			variants[cookieName.replace(/^MEETUP_VARIANT_|_DEV$/g, '')] =
				state[cookieName];
		}
		return variants;
	}, {});
