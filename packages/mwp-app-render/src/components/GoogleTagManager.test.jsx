import React from 'react';
import { shallow } from 'enzyme';
import { GoogleTagManagerScript, GoogleTagManagerNoscript } from './GoogleTagManager';

describe('<GoogleTagManagerScript />', () => {
	it('matches snap', () => {
		expect(shallow(<GoogleTagManagerScript />)).toMatchSnapshot();
	});
});

describe('<GoogleTagManagerNoscript />', () => {
	it('matches snap', () => {
		expect(shallow(<GoogleTagManagerNoscript />)).toMatchSnapshot();
	});
});
