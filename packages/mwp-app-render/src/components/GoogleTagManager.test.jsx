import React from 'react';
import { shallow } from 'enzyme';
import GoogleTagManager from './GoogleTagManager';

const shallowRender = (props = MOCK_PROPS) => {
	return shallow(<GoogleTagManager {...props} />);
};

describe('google tag manager', () => {
	it('returns null if rtf is false', () => {
		expect(shallowRender({rtf: false})).toMatchSnapshot();
	});
	describe('script', () => {
		const props = {
			rtf: true,
			item: 'script',
		};
		it('matches snap prod environment', () => {
			expect(shallowRender({...props, isProd: true})).toMatchSnapshot();
		});
		it('matches snap for dev environment', () => {
			expect(shallowRender({...props, isProd: false})).toMatchSnapshot();
		});
	});
	describe('noscript', () => {
		const props = {
			rtf: true,
			item: 'noscript',
		}; 
		it('matches snap prod environment', () => {
			expect(shallowRender({...props, isProd: true})).toMatchSnapshot();
		});
		it('matches snap for dev environment', () => {
			expect(shallowRender({...props, isProd: false})).toMatchSnapshot();
		});
	});
});
