import React from 'react';
import { shallow } from 'enzyme';
import { SEOHeadComponent } from './SEOHead';

const MOCK_PROPS = {
	baseUrl: 'https://baseUrl.com',
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
	describe('robots', () => {
		const robotsSelector = 'meta[name="robots"]';
		it('defaults to robots "on"', () => {
			const props = {...MOCK_PROPS};
			delete props.robots;
			expect(renderComponent(props).find(robotsSelector)).toMatchSnapshot();
		});
		it('explicity turns robots "on"', () => {
			const props = {...MOCK_PROPS, robots: true};
			delete props.robots;
			expect(renderComponent(props).find(robotsSelector)).toMatchSnapshot();
		});
		it('turns robots "off"', () => {
			const props = {...MOCK_PROPS, robots: false};
			expect(renderComponent(props).find(robotsSelector)).toMatchSnapshot();
		});
	});
	describe('Custom Open Graph data', () => {
		const ogDescriptionSelector = 'meta[property="og:description"]';
		it('renders pageDescription as open graph description', () => {
			expect(renderComponent().find(ogDescriptionSelector)).toMatchSnapshot();
		});
		it('renders custom open graph description', () => {
			const props = {...MOCK_PROPS, ogDescription: 'mock custom open graph description' };
			expect(renderComponent(props).find(ogDescriptionSelector)).toMatchSnapshot();
		});
	});
	describe('imageUrl', () => {
		it('applies provided imageUrl to og:image, twitter:image and img_src tags', () => {
			expect(renderComponent()).toMatchSnapshot();
		});
		it('applies meet script logo to og:image, twitter:image and img_src tags when imageUrl is not provided', () => {
			const props = {
				...MOCK_PROPS,
				imageUrl: undefined,
			};
			expect(renderComponent(props)).toMatchSnapshot();
		});
	});
});
