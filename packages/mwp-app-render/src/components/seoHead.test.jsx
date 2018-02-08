import React from 'react';
import { shallow } from 'enzyme';
import { SEOHeadComponent } from './SEOHead';

const MOCK_PROPS = {
	baseUrl: 'https://baseUrl.com',
	cardType: 'mock-card-type',
	imageUrl: 'https://www.mock-image-url.com/',
	ldJson: [{ foo: 'MOCK_LD_JSON' }, { bar: 'MOCK_LD_JSON' }],
	localeCode: 'es-ES',
	pageDescription: 'mock description',
	pageKeywords: 'mock keywords',
	pageMeta: [{ mock: 'meta' }, { more: 'mock' }],
	pageTitle: 'mock-page-title',
	robots: false,
	route: '/mock/preview/route',
};

const renderComponent = (props = MOCK_PROPS) => shallow(<SEOHeadComponent {...props} />);

describe('SEOHead', () => {
	it('renders component markup', () => {
		expect(renderComponent()).toMatchSnapshot();
	});
	describe('imageUrl prop usage', () => {
		describe('og:image tag', () => {
			it('renders imageUrl', () => {
				expect(
					renderComponent().find('meta[property="og:image"]')
				).toMatchSnapshot();
			});
			it('falls back to meetup script logo when imageUrl is undefined', () => {
				const props = {
					...MOCK_PROPS,
					imageUrl: undefined,
				};
				expect(
					renderComponent(props).find('meta[property="og:image"]')
				).toMatchSnapshot();
			});
		});
		describe('twitter:image tag', () => {
			it('renders imageUrl', () => {
				expect(
					renderComponent().find('meta[property="twitter:image"]')
				).toMatchSnapshot();
			});
			it('falls back to meetup script logo when imageUrl is undefined', () => {
				const props = {
					...MOCK_PROPS,
					imageUrl: undefined,
				};
				expect(
					renderComponent(props).find('meta[property="twitter:image"]')
				).toMatchSnapshot();
			});
		});
		describe('link image_src tag', () => {
			it('renders imageUrl', () => {
				expect(renderComponent().find('link[rel="image_src"]')).toMatchSnapshot();
			});
			it('falls back to meetup script logo when imageUrl is undefined', () => {
				const props = {
					...MOCK_PROPS,
					imageUrl: undefined,
				};
				expect(
					renderComponent(props).find('link[rel="image_src"]')
				).toMatchSnapshot();
			});
		});
	});
});
