import React from 'react';
import { shallow } from 'enzyme';
import UXCaptureImageLoad from './UXCaptureImageLoad';

const MOCK_PROPS = {
	mark: 'ux-image-load-logo',
	src: '/foo.png',
	className: 'someClass',
	alt: 'altText',
	height: '50',
};

const renderComponent = (props = MOCK_PROPS) =>
	shallow(<UXCaptureImageLoad {...props} />);

describe('UXCaptureImageLoad', () => {
	it('renders component markup', () => {
		global.window = { UX: { mark: jest.fn() } };
		expect(renderComponent()).toMatchSnapshot();
		delete global.window;
	});
});
