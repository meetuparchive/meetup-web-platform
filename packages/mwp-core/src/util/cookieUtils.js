import querystring from 'qs';
import config from 'mwp-config';
import { logger } from 'mwp-logger-plugin';
const appConfig = config.getServer().properties;

export const MEMBER_COOKIE = appConfig.isProd ? 'MEETUP_MEMBER' : 'MEETUP_MEMBER_DEV';

export const parseMemberCookie = state => {
	if (!state[MEMBER_COOKIE]) {
		logger.warn('No member cookie found - there might be a problem with auth');
		// no member cookie - always return id=0
		return { id: 0 };
	}
	const member = querystring.parse(state[MEMBER_COOKIE]);
	member.id = parseInt(member.id, 10) || 0;
	return member;
};

/*
 * Some variant settings can be passed in from MEETUP_VARIANT_XXX cookies. This
 * function reads those cookie values from `state` and returns a map of values
 */
export const getVariants = state =>
	Object.keys(state).reduce((variants, cookieName) => {
		const isEnvCookie = !(appConfig.isProd ^ !cookieName.endsWith('_DEV')); // XNOR - both conditions or neither condition
		if (cookieName.startsWith('MEETUP_VARIANT_') && isEnvCookie) {
			variants[cookieName.replace(/^MEETUP_VARIANT_|_DEV$/g, '')] =
				state[cookieName];
		}
		return variants;
	}, {});
