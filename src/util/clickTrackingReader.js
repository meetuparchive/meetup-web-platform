import avro from '../plugins/tracking/avro';
import config from './config';
import { parseMemberCookie } from './cookieUtils';

export const clickCookieOptions = {
	isSecure: config.isProd,
	isHttpOnly: false,
	domain: `${config.isProd ? '' : '.dev'}.meetup.com`,
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
	const cookieValue = rawCookieValue instanceof Array
		? rawCookieValue[0]
		: rawCookieValue;
	if (!cookieValue || cookieValue === 'undefined') {
		return;
	}

	const cookieJSON = decodeURIComponent(cookieValue);
	const { history } = JSON.parse(cookieJSON);
	history.map(clickToClickRecord(request)).forEach(avro.loggers.click);

	reply.unstate('click-track', clickCookieOptions);
	return;
}
