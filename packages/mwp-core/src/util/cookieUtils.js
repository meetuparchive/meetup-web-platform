import querystring from 'qs';
import config from 'mwp-cli/src/config';
import { logger } from 'mwp-logger-plugin';
const appConfig = config.getServer().properties;

export const MEMBER_COOKIE = appConfig.isProd
	? 'MEETUP_MEMBER'
	: 'MEETUP_MEMBER_DEV';

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
