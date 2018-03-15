import React from 'react';
import { getGoogleTagManagerSnippet } from './googleTagManager';

describe('getGoogleTagManagerSnippet()', () => {
	it('matches snap', () => {
		expect(getGoogleTagManagerSnippet()).toMatchSnapshot();
	});
});
