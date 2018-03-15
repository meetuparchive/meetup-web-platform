import React from 'react';
import { shallow } from 'enzyme';
import { getGoogleTagManagerSnippet, GoogleTagManagerNoscript } from './GoogleTagManager';

describe('getGoogleTagManagerSnippet()', () => {
	it('matches snap', () => {
		expect(getGoogleTagManagerSnippet()).toMatchSnapshot();
	});
});

describe('<GoogleTagManagerNoscript />', () => {
	it('matches snap', () => {
		expect(shallow(<GoogleTagManagerNoscript />)).toMatchSnapshot();
	});
});
