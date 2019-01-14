import { getISOStringNow, getISOStringWithUTCOffset } from './trackingUtils';
import { ZonedDateTime, ZoneId, LocalDate, LocalTime } from 'js-joda';

// regex to match ISO 8601 format
// eg: 2019-01-07T11:03:28.262-05:00
// reference: https://www.myintervals.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
const ISO_RE = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/; //eslint-disable-line

describe('getISOStringNow', () => {
	it('returns the current time as an ISO string with the correct format', () => {
		const ISOString = getISOStringNow();
		const matches = ISOString.match(ISO_RE);

		expect(matches).not.toBeNull();
		expect(matches[0]).toEqual(ISOString);
	});
});

describe('getISOStringWithUTCOffset', () => {
	it('returns an ISO string formatted date', () => {
		const zdt = ZonedDateTime.of(
			LocalDate.parse('2019-01-10'),
			LocalTime.MIDNIGHT,
			ZoneId.of('Europe/Paris')
		); // 2019-01-10T00:00+02:00[Europe/Paris]

		const ISOString = getISOStringWithUTCOffset(zdt);
		const matches = ISOString.match(ISO_RE);

		expect(matches).not.toBeNull();
		expect(matches[0]).toEqual(ISOString);
	});
});
