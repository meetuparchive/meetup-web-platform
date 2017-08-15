import React from 'react';
import { shallow } from 'enzyme';
import ServerApp from './ServerApp';

describe('ServerApp', function() {
	const routes = [];
	const basename = '';
	const appWrapper = shallow(
		<ServerApp
			routes={routes}
			store={{}}
			basename={basename}
			context={{}}
			location="/foo"
		/>
	);
	it('exists', function() {
		expect(appWrapper).toMatchSnapshot();
	});
});
