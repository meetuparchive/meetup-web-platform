const isProd = process.env.NODE_ENV === 'production';
export const MEMBER_ID_COOKIE = isProd ? 'MEETUP_MEMBER_ID' : 'MEETUP_MEMBER_ID_DEV';

export const clickToClickRecord = request => click => {
	const eventDate = new Date();
	return {
		timestamp: eventDate.getTime().toString(),
		requestId: request.id,
		memberId: parseInt(request.state[MEMBER_ID_COOKIE], 10) || 0,
		lineage: click.lineage,
		linkText: click.linkText || '',
		coordX: click.coords[0],
		coordY: click.coords[1],
	};
};

export default function processClickTracking(request, reply) {
	const cookieValue = (request.state || {})['click-track'];
	if (!cookieValue) {
		return;
	}

	try {
		const cookieJSON = decodeURIComponent(cookieValue);
		const { history } = JSON.parse(cookieJSON);
		history
			.map(clickToClickRecord(request))
			.forEach(clickRecord =>
				request.log(['click'], JSON.stringify(clickRecord))
			);
	} catch(err) {
		console.error(JSON.stringify({
			message: 'Could not parse click-track cookie',
			cookieValue
		}));
		return;
	}


	reply.unstate('click-track', {
		isSecure: process.env.NODE_ENV === 'production',
		isHttpOnly: false,
		domain: '.meetup.com',
	});
	return;
}

