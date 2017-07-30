import avro from './avro';
import { parseMemberCookie } from '../../../util/cookieUtils'; // TODO: provide this info through new plugin

const isProd = process.env.NODE_ENV === 'production';
export const clickCookieOptions = {
	isSecure: isProd,
	isHttpOnly: false,
	domain: `${isProd ? '' : '.dev'}.meetup.com`,
};

export const clickToClickRecord = request => click => {
	return {
		timestamp: click.timestamp || new Date().toISOString(),
		requestId: request.id,
		memberId: parseMemberCookie(request.state).id,
		lineage: click.lineage,
		linkText: click.linkText || '',
		coordX: click.coords[0],
		coordY: click.coords[1],
	};
};

export default function processClickTracking(request, reply) {
	const rawCookieValue = (request.state || {})['click-track'];
	// It's possible that multiple cookies with the same value were sent, e.g.
	// one value for .dev.meetup.com and another for .meetup.com - parse only the first
	const cookieValue =
		rawCookieValue instanceof Array ? rawCookieValue[0] : rawCookieValue;
	if (!cookieValue || cookieValue === 'undefined') {
		return;
	}

	const cookieJSON = decodeURIComponent(cookieValue);
	const { history } = JSON.parse(cookieJSON);
	history.map(clickToClickRecord(request)).forEach(avro.loggers.click);

	reply.unstate('click-track', clickCookieOptions);
	return;
}
