import React from 'react';
import { shallow } from 'enzyme';
import Dom from './Dom';

const MOCK_BASE_URL = 'https://www.mock-base-url.com';  

const MOCK_PROPS = {
	appMarkup: '<div>mock app markup</div>',
	assetPublicPath: '/mock/asset/public/path',
	baseUrl: MOCK_BASE_URL,
	head: {
		title: { toComponent: () => null },
		meta: { toComponent: () => null },
		link: { toComponent: () => null },
		script: { toComponent: () => null },
	},
	initialState: {
		config: {
			requestLanguage: 'fr-FR',
		},
	}, 
	scripts: ['script.js'],
	cssLinks: ['style.css'],
};

describe('Dom', function() {
	it('renders with mock props', function() {
		expect(shallow(<Dom {...MOCK_PROPS} />)).toMatchSnapshot();
	});
});
