import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import BrowserApp from './BrowserApp';

const renderer = new ShallowRenderer();

describe('BrowserApp', function() {
	const routes = [];
	const baseUrl = '';
	const browserApp = (
		<BrowserApp routes={routes} store={{}} baseUrl={baseUrl} />
	);
	renderer.render(browserApp);
	const app = renderer.getRenderOutput(); // this actually returns the <BrowserRouter> instance
	it('exists', function() {
		expect(app).not.toBeNull();
	});
});
