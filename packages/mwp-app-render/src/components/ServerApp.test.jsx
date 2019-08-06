import React from 'react';
import { shallow } from 'enzyme';
import ServerApp from './ServerApp';

describe('ServerApp', function() {
	const routes = [];
	const basename = '';
	const appWrapper = shallow(
		<ServerApp
			h={{}}
			request={{ raw: { url: '/foo' } }}
			routes={routes}
			store={{}}
			appContext={{ basename }}
			routerContext={{}}
		/>
	);
	it('exists', function() {
		expect(appWrapper).toMatchSnapshot();
	});
});
