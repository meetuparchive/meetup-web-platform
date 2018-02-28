import { MOCK_EVENT } from 'meetup-web-mocks/lib/api';

import {
	generateFeeLdJson,
	generateLocationLdJson,
	generateOrganizationLdJson,
	generateEventLdJson,
	generateEventDateForSeo,
} from './ldJson';

const MOCK_VENUE = {
	name: 'some place',
	address_1: 'address 1',
	address_2: 'address 2',
	address_3: 'address 3',
	city: 'city name',
	state: 'NY',
	zip: '00000',
	country: 'usa',
	localized_country_name: 'usa',
};

const MOCK_FEE = {
	amount: 11,
	currency: 'USD',
};

describe('generateFeeLdJson', () => {
	it('should generate a ld+json object for offers', () => {
		const processedObj = generateFeeLdJson(MOCK_FEE);
		expect(processedObj).toMatchSnapshot();
	});
});

describe('generateLocationLdJson', () => {
	it('should generate a ld+json object for location', () => {
		const processedObj = generateLocationLdJson(MOCK_VENUE);
		expect(processedObj).toMatchSnapshot();
	});
});

describe('generateEventLdJson', () => {
	it('should generate a ld+json object for event', () => {
		const event = {
			...MOCK_EVENT,
			time: 1501284510,
			MOCK_VENUE,
			MOCK_FEE,
		};
		const processedObj = generateEventLdJson(event);
		expect(processedObj).toMatchSnapshot();
	});
});

describe('generateOrganizationLdJson', () => {
	it('should generate json with all the correct fields', () => {
		const baseUrl = 'http://www.craaazyurl.com';
		const localeCode = 'es';
		const route = '/woooo';
		const json = generateOrganizationLdJson(baseUrl, localeCode, route);
		expect(json).toHaveProperty('@type');
		expect(json).toHaveProperty('@context');
		expect(json).toHaveProperty('url');
		expect(json).toHaveProperty('name');
		expect(json).toHaveProperty('logo');
		expect(json).toHaveProperty('sameAs');
		expect(json.sameAs).toHaveLength(5);
	});

	it('should generate localized url and social media links', () => {
		const baseUrl = 'http://www.craaazyurl.com';
		const localeCode = 'fr-FR';
		const route = '/woooo';
		const json = generateOrganizationLdJson(baseUrl, localeCode, route);
		const facebookLink = json.sameAs[0];
		const twitterLink = json.sameAs[1];
		expect(json.url).toBe(`${baseUrl}/${localeCode}${route}`);
		expect(facebookLink).toBe('https://www.facebook.com/MeetupFR/');
		expect(twitterLink).toBe('https://twitter.com/MeetupFR/');
	});
});

describe('generateEventDateForSeo', () => {
	it('should generate date to Google SEO specs', () => {
		const timeUTC = 1559752200000; // fixed millisecond value
		const offset = -18000000; // Eastern Time

		const formattedDate = generateEventDateForSeo(timeUTC, offset);
		expect(formattedDate).toBe('2019-06-05T11:30-05:00');
	});

	it('should generate date with a default of +00:00 timezone if offset is undefined', () => {
		const timeUTC = 1559752200000; // fixed millisecond value
		const offset = undefined;

		const formattedDate = generateEventDateForSeo(timeUTC, offset);
		expect(formattedDate).toBe('2019-06-05T16:30+00:00');
	});

	it('should generate date correctly for 30 min off timezones', () => {
		const timeUTC = 1559752200000; // fixed millisecond value
		const offset = 19800000; // India + Sri Lanka

		const formattedDate = generateEventDateForSeo(timeUTC, offset);
		expect(formattedDate).toBe('2019-06-05T22:00+05:30');
	});

	it('should generate date correctly for 45 min off timezones', () => {
		const timeUTC = 1559752200000; // fixed millisecond value
		const offset = 31500000; // Australia/Eucla

		const formattedDate = generateEventDateForSeo(timeUTC, offset);
		expect(formattedDate).toBe('2019-06-06T01:15+08:45');
	});
});
