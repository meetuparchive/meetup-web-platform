import Joi from 'joi';
import { polyfillServiceUrl, getPolyfill } from './browserPolyfill';

const MOCK_LOCALE = 'fr-FR';

describe('polyfillServiceUrl', () => {
	it('returns a url string', () => {
		const url = polyfillServiceUrl(MOCK_LOCALE);
		expect(Joi.validate(url, Joi.string().uri()).error).toBeNull();
	});
});

describe('getPolyfill', () => {
	it('returns false for Chrome UA string', () => {
		expect(
			getPolyfill(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
				MOCK_LOCALE
			)
		).toBe(false);
	});

	it('returns false for Firefox UA string', () => {
		expect(
			getPolyfill(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:10.0) Gecko/20100101 Firefox/10.0',
				MOCK_LOCALE
			)
		).toBe(false);
	});

	it('returns a polyfill url for Edge', () => {
		const url = polyfillServiceUrl(MOCK_LOCALE);
		expect(
			getPolyfill(
				'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136',
				MOCK_LOCALE
			)
		).toEqual(url);
	});
	it('returns a polyfill url if userAgent is not `Chrome` or `Firefox`', () => {
		const url = polyfillServiceUrl(MOCK_LOCALE);
		expect(getPolyfill('Safari', MOCK_LOCALE)).toEqual(url);
	});
});
