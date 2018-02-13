import locales from 'mwp-config/locales'

import {
	generateCanonicalUrlMetaTags,
} from './links';

describe('generateCanonicalUrlMetaTags', () => {
	it('should generate locale <link />s for all locales', () => {
		const baseUrl = 'http://www.amaraisthecutest.cat',
			route = '/samsonite-incorporated';
		const canonicalUrls = generateCanonicalUrlMetaTags(baseUrl, '', route);
		// + 2 for default canonical links
		expect(canonicalUrls).toHaveLength(locales.length + 2);
	});

	it('should generate a canonical url with locale if *not* en-US', () => {
		const baseUrl = 'http://www.amaraisthecutest.cat',
			localeCode = 'fr-FR',
			route = '/samsonite-incorporated';
		const processedObj = generateCanonicalUrlMetaTags(baseUrl, localeCode, route);
		const filterArr = processedObj.filter(
			element =>
				element.props.rel === 'canonical' &&
				element.props.href === `${baseUrl}/${localeCode}${route}`
		);
		expect(filterArr).toHaveLength(1);
	});

	it('should generate a canonical url without locale if en-US', () => {
		const baseUrl = 'http://www.amaraisthecutest.cat',
			localeCode = 'en-US',
			route = '/samsonite-incorporated';
		const processedObj = generateCanonicalUrlMetaTags(baseUrl, localeCode, route);
		const filterArr = processedObj.filter(
			element =>
				element.props.rel === 'canonical' &&
				element.props.href === `${baseUrl}${route}`
		);
		expect(filterArr).toHaveLength(1);
	});

	it('should generate a x-default url', () => {
		const baseUrl = 'http://www.amaraisthecutest.cat',
			localeCode = 'fr-FR',
			route = '/samsonite-incorporated';
		const processedObj = generateCanonicalUrlMetaTags(baseUrl, localeCode, route);
		const filterArr = processedObj.filter(
			element =>
				element.props.hrefLang === 'x-default' &&
				element.props.href === `${baseUrl}${route}`
		);
		expect(filterArr).toHaveLength(1);
	});
});
