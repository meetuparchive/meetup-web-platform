import React from 'react';
import { shallow } from 'enzyme';

import {
	generateMetaData,
	generateGeoMetaData,
} from './metaTags';

describe('generateMetaData', () => {
	it('matches snap', () => {
		const MOCK_META = {
			appPath: '/mock/app/path',
			baseUrl: 'https://mock-base-url.com',
			imageUrl: 'https://www.meetup.com/mock-default-image.jpg',
			localeCode: 'fr-FR',
			pageTitle: 'mock title',
			pageDescription: 'mock description',
			pageKeywords: 'mock,keywords,comma,separated',
			route: '/mock/preview/path',
		};
		const metaData = generateMetaData(MOCK_META);
		expect(metaData).toMatchSnapshot();
	});
});

describe('generateGeoMetaData', () => {
	const MOCK_GEO = {
		city: 'mock-city',
		country: 'mock-country',
		lat: 'mock-lat',
		lon: 'mock-lon',
		state: 'mock-state',
	};
	it('matches snap', () => {
		const geoMetaData = generateGeoMetaData(MOCK_GEO);
		expect(geoMetaData).toMatchSnapshot();
	});
	it('should *not* set geo.position when lat or lon are missing', () => {
		const mockGeo = { ...MOCK_GEO };
		delete mockGeo.lat;
		const geoMetaData = generateGeoMetaData(mockGeo);
		expect(geoMetaData).toMatchSnapshot();
	});
	it('should exclude state and country from geo.placename when not provided', () => {
		const mockGeo = { ...MOCK_GEO };
		delete mockGeo.state;
		delete mockGeo.country;
		const geoMetaData = generateGeoMetaData(mockGeo);
		expect(geoMetaData).toMatchSnapshot();
	});
	it('should exclude state from geo.placename when not provided', () => {
		const mockGeo = { ...MOCK_GEO };
		delete mockGeo.state;
		const geoMetaData = generateGeoMetaData(mockGeo);
		expect(geoMetaData).toMatchSnapshot();
	});
});
