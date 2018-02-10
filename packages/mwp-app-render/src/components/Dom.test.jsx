import React from 'react';
import { shallow } from 'enzyme';
import Dom from './Dom';

const MOCK_BASENAME = '/fo-BA';

const MOCK_PROPS = {
	appMarkup: '<div>mock app markup</div>',
	assetPublicPath: '/mock/asset/public/path',
	basename: MOCK_BASENAME,
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
