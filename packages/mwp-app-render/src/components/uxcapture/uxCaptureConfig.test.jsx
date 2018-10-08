import React from 'react';
import { shallow } from 'enzyme';
import UXCaptureConfig from './UXCaptureConfig';

const MOCK_PROPS = {
	onMark: foo => {
		if (foo) {
			return foo;
		}
	},
	onMeasure: bar => {
		if (bar) {
			return bar;
		}
	},
};

const renderComponent = (props = MOCK_PROPS) =>
	shallow(<UXCaptureConfig {...props} />);

describe('UXCaptureConfig', () => {
	it('renders correct markup when all props are defined', () => {
		expect(renderComponent()).toMatchSnapshot();
	});

	it('renders the correct markup when only onMeasure is provided', () => {
		const onMeasureProp = {
			onMeasure: MOCK_PROPS.onMeasure,
		};
		expect(renderComponent(onMeasureProp)).toMatchSnapshot();
	});

	it('renders the correct markup when only onMark is provided', () => {
		const onMarkProp = {
			onMark: MOCK_PROPS.onMark,
		};
		expect(renderComponent(onMarkProp)).toMatchSnapshot();
	});

	it('renders the correct markup when no props are provided', () => {
		expect(renderComponent({})).toMatchSnapshot();
	});

	it('renders the correct markup when unsupported props are provided', () => {
		const invalidProps = {
			...MOCK_PROPS,
			invalid: 'some prop',
		};
		expect(renderComponent(invalidProps)).toMatchSnapshot();
	});
});
