import React from 'react';
import { shallow } from 'enzyme';
import BrowserApp from './BrowserApp';

jest.mock('./ApolloProvider', () => {
	return props => <div {...props} />;
});

// TODO: skipping test until browser test environment enabled
describe.skip('BrowserApp', function() {
	const routes = [];
	const basename = '';
	const appWrapper = shallow(
		<BrowserApp routes={routes} store={{}} basename={basename} />
	);
	it('exists', function() {
		expect(appWrapper).toMatchSnapshot();
	});
});
