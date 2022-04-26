import JSCookie from 'js-cookie';
import { clickToClickRecord } from './clickReader';
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

export const setClickCookie = clickData => {
	const memberId = getMemberIdFromCookie();
	console.log("wut")
	if (clickData) {
		const stringifiedRecord = JSON.stringify({
			record: {...clickData, memberId},
			metadata: {
				memberId: memberId,
				//browserId: getBrowserIdFromCookie(),
				referer: window.document.referrer,
				url: window.location.href
			}
		  });
		console.log("in clickstate", stringifiedRecord)
		avro.loggers.browserClick(stringifiedRecord);
	}
};

export const appendClick = (clickData, memberId) =>
	setClickCookie(clickData, memberId);
