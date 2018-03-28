import React from 'react';
import { getGoogleTagManagerSnippet, gtmPush } from './googleTagManager';


describe('getGoogleTagManagerSnippet()', () => {
	it('matches snap', () => {
		expect(getGoogleTagManagerSnippet()).toMatchSnapshot();
	});
});

describe('gtmPush()', () => {
	const MOCK_VARS = { 'foo': 'bar' };

	it('should push mocked variables to `dataLayer`', () => {
		global.window = {};
		window.dataLayer = [];

		gtmPush(MOCK_VARS);
		expect(window.dataLayer).toContain(MOCK_VARS);
	});
});
