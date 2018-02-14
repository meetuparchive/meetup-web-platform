import React from 'react';
import { shallow } from 'enzyme';
import locales from 'mwp-config/locales'

import {
	generateCanonicalUrlLinkTags,
} from './links';

describe('generateCanonicalUrlLinkTags', () => {
	const MOCK_BASE_URL = 'http://www.mock-base-url.com';
	const MOCK_ROUTE = '/mockroute';
	const MOCK_LOCALE_CODE = 'fr-FR';

	it('should generate locale <link />s for all locales', () => {
		const canonicalUrlMetaTags = generateCanonicalUrlLinkTags(MOCK_BASE_URL, 'en-US', MOCK_ROUTE);
		expect(canonicalUrlMetaTags).toMatchSnapshot();
	});

	it('should generate a canonical link tag with locale if *not* en-US', () => {
		const canonicalUrlMetaTags = generateCanonicalUrlLinkTags(MOCK_BASE_URL, MOCK_LOCALE_CODE, MOCK_ROUTE);
		expect(canonicalUrlMetaTags.filter(el => el.props.rel === 'canonical')).toMatchSnapshot();
	});

	it('should generate a canonical link tag without locale if en-US', () => {
		const canonicalUrlMetaTags = generateCanonicalUrlLinkTags(MOCK_BASE_URL, 'en-US', MOCK_ROUTE);
		expect(canonicalUrlMetaTags.filter(el => el.props.rel === 'canonical')).toMatchSnapshot();
	});

	it('should generate a x-default url that is baseUrl + route', () => {
		const canonicalUrlMetaTags = generateCanonicalUrlLinkTags(MOCK_BASE_URL, MOCK_LOCALE_CODE, MOCK_ROUTE);
		expect(canonicalUrlMetaTags.filter(el => el.props.hrefLang === 'x-default')).toMatchSnapshot();
	});
});
