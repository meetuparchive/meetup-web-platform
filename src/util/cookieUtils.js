import querystring from 'qs';
import config from './config';
import logger from './logger';

export const MEMBER_COOKIE = config.isProd
	? 'MEETUP_MEMBER'
	: 'MEETUP_MEMBER_DEV';
export const LANGUAGE_COOKIE = config.isProd
	? 'MEETUP_LANGUAGE'
	: 'MEETUP_LANGUAGE_DEV';

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
