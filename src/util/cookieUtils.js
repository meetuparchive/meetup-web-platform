import querystring from 'qs';

const isProd = process.env.NODE_ENV === 'production';
export const MEMBER_COOKIE = isProd ? 'MEETUP_MEMBER' : 'MEETUP_MEMBER_DEV';

export const parseMemberCookie = state =>
	querystring.parse(state[MEMBER_COOKIE]);

