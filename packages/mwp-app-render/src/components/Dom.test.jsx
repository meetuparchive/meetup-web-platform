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
			apiUrl: 'https://www.mock-api-url.com',
			baseUrl: MOCK_BASE_URL,
			enableServiceWorker: true,
			requestLanguage: 'fr-FR',
			supportedLangs: ['en-US', 'de-De', 'es-ES'],
			initialNow: '1517589465414',
			variants: 'mock-variants',
			entryPath: '/ny-tech',
			media: 'mobile',
		},
	}, 
	scripts: ['script.js'],
	cssLinks: ['style.css'],
};

describe('Dom', function() {
	const domComponent = shallow(
		<Dom {...MOCK_PROPS} />
	);
	it('renders with mock props', function() {
		expect(domComponent).toMatchSnapshot();
	});
});
