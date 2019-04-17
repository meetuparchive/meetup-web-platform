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
			appContext={{ basename }}
			routerContext={{}}
			location="/foo"
		/>
	);
	it('exists', function() {
		expect(appWrapper).toMatchSnapshot();
	});
});
