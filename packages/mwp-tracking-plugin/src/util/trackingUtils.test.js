import { getZonedDateTimeStringWithUTCOffset } from './trackingUtils';

describe('getZonedDateTimeStringWithUTCOffset', () => {
	it('returns a zonedDateTime string with the correct format', () => {
		// regex to match format: 2019-01-07T11:03:28.262-05:00
		const re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+-\d{2}:\d{2}$/;
		const zdt = getZonedDateTimeStringWithUTCOffset();
		const matches = zdt.match(re);

		expect(matches).not.toBeNull();
		expect(matches[0]).toEqual(zdt);
	});
});
