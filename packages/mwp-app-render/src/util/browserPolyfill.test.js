import Joi from 'joi';
import {
	polyfillServiceUrl,
	getPolyfill,
} from './browserPolyfill';

const MOCK_LOCALE = 'fr-FR'

describe('polyfillServiceUrl', () => {
	it('returns a url string', () => {
		const url = polyfillServiceUrl(MOCK_LOCALE);
		expect(Joi.validate(url, Joi.string().uri()).error).toBeNull();
	});
});

describe('getPolyfill', () => {
	it('returns false if userAgent includes `Chrome`', () => {
		expect(getPolyfill('Chrome', MOCK_LOCALE)).toBe(false);
	}) ;

	it('returns false if userAgent includes `Firefox`', () => {
		expect(getPolyfill('Firefox', MOCK_LOCALE)).toBe(false);
	}) ;

	it('returns a polyfill url if userAgent is not `Chrome` or `Firefox`', () => {
		const url = polyfillServiceUrl(MOCK_LOCALE);
		expect(getPolyfill('Safari', MOCK_LOCALE)).toEqual(url);
	}) ;
});
