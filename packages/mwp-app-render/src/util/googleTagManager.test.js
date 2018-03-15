import React from 'react';
import { getGoogleTagManagerSnippet } from './GoogleTagManager';

describe('getGoogleTagManagerSnippet()', () => {
	it('matches snap', () => {
		expect(getGoogleTagManagerSnippet()).toMatchSnapshot();
	});
});
