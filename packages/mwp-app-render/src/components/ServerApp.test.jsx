import React from 'react';
import { shallow } from 'enzyme';
import ServerApp from './ServerApp';

jest.mock('./ApolloProvider', () => {
	return props => <div {...props} />;
});

describe('ServerApp', function() {
	const routes = [];
	const basename = '';
	const appWrapper = shallow(
		<ServerApp
			h={{}}
			request={{ url: { pathname: '/foo', search: '', hash: '' } }}
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
