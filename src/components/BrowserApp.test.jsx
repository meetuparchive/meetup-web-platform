import React from 'react';
import TestUtils from 'react-dom/test-utils';
import BrowserApp from './BrowserApp';

const renderer = TestUtils.createRenderer();

describe('BrowserApp', function() {
	const routes = [];
	const baseUrl = '';
	const browserApp = (
		<BrowserApp routes={routes} store={{}} baseUrl={baseUrl} />
	);
	renderer.render(
		browserApp
	);
	const app = renderer.getRenderOutput();  // this actually returns the <BrowserRouter> instance
	it('exists', function() {
		expect(app).not.toBeNull();
	});
});

