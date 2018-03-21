import React from 'react';
import { shallow } from 'enzyme';
import Dom from './Dom';

const MOCK_BASENAME = '/fo-BA';

const MOCK_PROPS = {
	appMarkup: '<div>mock app markup</div>',
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
	userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko', // IE 11
};

describe('Dom', function() {
	it('renders with mock props', function() {
		expect(shallow(<Dom {...MOCK_PROPS} />)).toMatchSnapshot();
	});
});
