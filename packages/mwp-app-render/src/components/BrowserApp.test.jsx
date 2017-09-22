import React from 'react';
import { shallow } from 'enzyme';
import BrowserApp from './BrowserApp';

describe('BrowserApp', function() {
	const routes = [];
	const basename = '';
	const appWrapper = shallow(
		<BrowserApp routes={routes} store={{}} basename={basename} />
	);
	it('exists', function() {
		expect(appWrapper).toMatchSnapshot();
	});
});
