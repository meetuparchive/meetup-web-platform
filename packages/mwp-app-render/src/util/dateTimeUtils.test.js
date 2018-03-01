import {
        padNumber,
        getFormattedTime,
        convertToLocalTime,
} from './dateTimeUtils';

const timeUTC = 1234567890; // fixed millisecond value
const eventOffset = -1234567; // fixed millisecond value
const runtimeDate = new Date(timeUTC + eventOffset); // time value determines whether local offset is in daylight savings
const runtimeOffset = runtimeDate.getTimezoneOffset() * 60 * 1000; // runtime-dependent millisecond offset

describe('padNumber', () => {
	it('should pad numbers less than 10', () => {
		for (let i = 0; i < 10; i += 1) {
			expect(padNumber(i)).toBe(`0${i}`);
		}
	});
	it('should not pad numbers greater or equal to 10', () => {
		for (let i = 10; i < 60; i += 1) {
			expect(padNumber(i)).toBe(String(i));
		}
	});
});

describe('getFormattedTime', () => {
	it('should return a local time string in the format: `HH:MM:SS`', () => {
		// Regex for formatted string `HH:MM:SS`
		const regExp = new RegExp(/\d{2}:\d{2}:\d{2}/);
		const date = new Date();
		expect(getFormattedTime(date)).toMatch(regExp);
	});
});

describe('convertToLocalTime', () => {
	it('should return a date with UTC offset by eventOffset _and_ runtimeOffset', () => {
		const expectedTime = timeUTC + eventOffset + runtimeOffset;
		expect(convertToLocalTime(timeUTC, eventOffset).getTime()).toBe(expectedTime);
	});
	it('should return expected date value based on time is provided with no offset', () => {
		const expectedTime =
			timeUTC + new Date(timeUTC).getTimezoneOffset() * 60 * 1000;
		expect(convertToLocalTime(timeUTC).getTime()).toBe(expectedTime);
	});
});
