import JSCookie from 'js-cookie';
import { parse } from 'querystring';

import avro from './avro';

/*
 * This module provides utilities for sending click tracking data
 */

const getMemberIdFromCookie = () => {
	const memberId = JSCookie.get('memberId');
	if (memberId) {
		return parseInt(memberId, 10);
	}
	return null;
};

const getBrowserIdFromCookie = () => {
	try {
		const cookieValue = JSCookie.get('MEETUP_BROWSER_ID') || '';
		const parsedCookie = parse(`${cookieValue}`.replace(/[^\w\s-=]/gm, ''));
		const id =
			(Array.isArray(parsedCookie.id) ? parsedCookie.id[0] : parsedCookie.id) ||
			'';
		return id;
	} catch (e) {
		return '';
	}
};

export const setClickCookie = clickData => {
	const memberId = getMemberIdFromCookie();
	if (clickData) {
		const stringifiedRecord = JSON.stringify({
			record: {
				lineage: clickData.lineage,
				linkText: clickData.linkText,
				coordX: clickData.coords[0],
				coordY: clickData.coords[1],
				timestamp: clickData.timestamp,
				tag: clickData.tag,
				memberId,
			},
			metadata: {
				memberId: memberId,
				browserId: getBrowserIdFromCookie(),
				referer: window.document.referrer,
				url: window.location.href,
			},
		});
		avro.loggers.browserClick(stringifiedRecord);
	}
};

export const appendClick = (clickData, memberId) =>
	setClickCookie(clickData, memberId);
