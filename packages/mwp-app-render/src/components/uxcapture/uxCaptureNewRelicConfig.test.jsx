import React from 'react';
import { shallow } from 'enzyme';
import UXCaptureNewRelicConfig from './UXCaptureNewRelicConfig';

const renderComponent = () => shallow(<UXCaptureNewRelicConfig />);

describe('UXCaptureNewRelicConfig', () => {
	it('renders correct markup when all props are defined', () => {
		expect(renderComponent()).toMatchSnapshot();
	});
});
