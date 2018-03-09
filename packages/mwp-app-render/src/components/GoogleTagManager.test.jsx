import React from 'react';
import { shallow } from 'enzyme';
import GoogleTagManager from './GoogleTagManager';

const renderComponent = (props = {}) => {
	return shallow(<GoogleTagManager {...props} />);
};

describe('google tag manager', () => {
	it('returns null if rtf is false', () => {
		expect(renderComponent({rtf: false}).equals(null)).toBe(true);
	});
	it('returns null if `tag` prop is undefined or not valid', () => {
		expect(renderComponent({rtf: false}).equals(null)).toBe(true);
		expect(renderComponent({rtf: false, tag: 'div'}).equals(null)).toBe(true);
	});
	describe('script tag', () => {
		const props = {
			rtf: true,
			tag: 'script',
		};
		it('matches snap prod environment', () => {
			expect(renderComponent({...props, isProd: true})).toMatchSnapshot();
		});
		it('matches snap for dev environment', () => {
			expect(renderComponent({...props, isProd: false})).toMatchSnapshot();
		});
	});
	describe('noscript tag', () => {
		const props = {
			rtf: true,
			tag: 'noscript',
		}; 
		it('matches snap prod environment', () => {
			expect(renderComponent({...props, isProd: true})).toMatchSnapshot();
		});
		it('matches snap for dev environment', () => {
			expect(renderComponent({...props, isProd: false})).toMatchSnapshot();
		});
	});
});
