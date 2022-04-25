import JSCookie from 'js-cookie';
import { clickToClickRecord } from './clickReader';
import avro from './avro';

/*
 * This module provides utilities for sending click tracking data
 */

const getMemberIdFromCookie = () => {
	const memberObj = JSCookie.parse('MEETUP_MEMBER');
	memberObj.id = memberObj.id ? parseInt(memberObj.id, 10) : 0;
	return memberObj;
};

export const setClickCookie = clickData => {
	const memberId = getMemberIdFromCookie();
	if (clickData) {
		const formatted = clickToClickRecord(null, memberId)(clickData);
		avro.loggers.awsclick(formatted);
	}
};

export const appendClick = (clickData, memberId) =>
	setClickCookie(clickData, memberId);
