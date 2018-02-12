import locales from 'mwp-config/locales';
import { MOCK_EVENT } from 'meetup-web-mocks/lib/api';

import {
	generateCanonicalUrl,
} from './links';

import {
	generateMetaData,
	generateGeoMetaData,
} from './metaTags';

const MOCK_META = {
	title: 'mock title',
	description: 'mock description',
	keywords: 'mock keywords',
	baseUrl: 'https://mock-base-url.com',
	route: '/mock/preview/path',
	appPath: '/mock/app/path',
	imageUrl: 'https://www.meetup.com/mock-default-image.jpg',
	localeCode: 'fr-FR',
};

describe('generateMetaData', () => {
	const metaData = generateMetaData(MOCK_META);

	it('should set the title', () => {
		const titleMeta = metaData.filter(
			obj => obj.content === MOCK_META.title && obj.property === 'og:title'
		);
		expect(titleMeta).toHaveLength(1);
	});

	it('should set the description', () => {
		const descriptionMeta = metaData.filter(
			obj =>
				obj.content === MOCK_META.description &&
				(obj.property === 'og:description' || obj.name === 'description')
		);
		expect(descriptionMeta).toHaveLength(2);
	});

	it('should set the keywords', () => {
		const keywordsMeta = metaData.filter(
			obj => obj.content === MOCK_META.keywords && obj.name === 'keywords'
		);
		expect(keywordsMeta).toHaveLength(1);
	});

	it('should set the app url', () => {
		const appUrlMeta = metaData.filter(obj => obj.property === 'al:web:url');
		expect(appUrlMeta).toHaveLength(1);
	});

	it('should set the appPath', () => {
		const appPathMeta = metaData.filter(obj => obj.content === MOCK_META.appPath);
		expect(appPathMeta).toHaveLength(2);
	});

	it('should set the url as localized url', () => {
		const expectedUrl = generateCanonicalUrl(
			MOCK_META.baseUrl,
			MOCK_META.localeCode,
			MOCK_META.route
		);
		const ogUrlMeta = metaData.filter(
			obj => obj.content === expectedUrl && obj.property === 'og:url'
		);
		const alUrlMeta = metaData.filter(
			obj => obj.content === expectedUrl && obj.property === 'al:web:url'
		);
		expect(ogUrlMeta).toHaveLength(1);
		expect(alUrlMeta).toHaveLength(1);
	});

	describe('open graph meta data', () => {
		it('should set og:site_name to "Meetup"', () => {
			const ogSiteName = obj =>
				obj.content === 'Meetup' && obj.property === 'og:site_name';
			expect(ogSiteName).toHaveLength(1);
		});
		it('should set og:type to "article"', () => {
			const metaData = generateMetaData(MOCK_META);
			const ogType = metaData.filter(
				obj => obj.content === 'article' && obj.property === 'og:type'
			);
			expect(ogType).toHaveLength(1);
		});
		it('should set og:url', () => {
			const urlMeta = metaData.filter(obj => obj.property === 'og:url');
			expect(urlMeta).toHaveLength(1);
		});
		it('should set og:image', () => {
			const ogImage = metaData.filter(
				obj => obj.content === MOCK_META.imageUrl && obj.property === 'og:image'
			);
			expect(ogImage).toHaveLength(1);
		});
	});
	describe('twitter meta data', () => {
		it('should set twitter:image', () => {
			const twitterImage = metaData.filter(
				obj =>
					obj.content === MOCK_META.imageUrl && obj.property === 'twitter:image'
			);
			expect(twitterImage).toHaveLength(1);
		});
	});
});

describe('generateGeoMetaData', () => {
	it('should set position', () => {
		const lat = 'hello world';
		const lon = 'hello world';
		const processedObj = generateGeoMetaData({ lat, lon });
		const filteredObj = processedObj.filter(
			obj => obj.content === `${lat};${lon}` && obj.property === 'geo.position'
		);
		expect(filteredObj).toHaveLength(1);
	});

	it('should NOT geo position', () => {
		const processedObj = generateGeoMetaData({});
		const filteredObj = processedObj.filter(obj => obj.property === 'geo.position');
		expect(filteredObj).toHaveLength(0);
	});

	it('should set place w/ city', () => {
		const city = 'hello world';
		const processedObj = generateGeoMetaData({ city });
		const filteredObj = processedObj.filter(
			obj => obj.content === city && obj.property === 'geo.placename'
		);
		expect(filteredObj).toHaveLength(1);
	});

	it('should set place w/ city + state', () => {
		const city = 'hello world';
		const state = 'hello world';
		const processedObj = generateGeoMetaData({ city, state });
		const filteredObj = processedObj.filter(
			obj => obj.content === `${city}, ${state}` && obj.property === 'geo.placename'
		);
		expect(filteredObj).toHaveLength(1);
	});

	it('should set place w/ city + state + country', () => {
		const city = 'hello world';
		const state = 'hello world';
		const country = 'USA';
		const processedObj = generateGeoMetaData({ city, state, country });
		const filteredObj = processedObj.filter(
			obj =>
				obj.content === `${city}, ${state}, ${country}` &&
				obj.property === 'geo.placename'
		);
		expect(filteredObj).toHaveLength(1);
	});

	it('should set place w/ city + state + country', () => {
		const country = 'USA';
		const processedObj = generateGeoMetaData({ country });
		const filteredObj = processedObj.filter(
			obj => obj.content === country && obj.property === 'geo.region'
		);
		expect(filteredObj).toHaveLength(1);
	});
});
