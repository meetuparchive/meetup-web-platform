import React from 'react';
import { shallow } from 'enzyme';
import UXCaptureCreate from './UXCaptureCreate';

const renderComponent = (props = MOCK_PROPS) =>
	shallow(<UXCaptureCreate {...props} />);

describe('UXCaptureCreate', () => {
	it('renders the correct markup when no props are provided', () => {
		expect(renderComponent({})).toMatchSnapshot();
	});
});
