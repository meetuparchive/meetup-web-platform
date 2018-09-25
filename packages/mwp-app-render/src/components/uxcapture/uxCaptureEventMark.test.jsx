import React from 'react';
import { shallow } from 'enzyme';
import UXCaptureEventMark from './UXCaptureEventMark';

const MOCK_PROPS = {
	mark: 'ux-image-load-logo',
};

const MOCK_CHILD = <img src="/foo" />;

const renderComponent = (props = MOCK_PROPS, children = MOCK_CHILD) =>
	shallow(
		<UXCaptureEventMark {...props}>
			{children}
		</UXCaptureEventMark>
	);

describe('UXCaptureEventMark', () => {
	it('renders component markup', () => {
		global.window = { UX: { mark: jest.fn() } };
		expect(renderComponent()).toMatchSnapshot();
		delete global.window;
	});

	it('returns the child element untouched if it has an onLoad prop', () => {
		global.window = { UX: { mark: jest.fn() } };
		const onLoadChild = <img src="/foo" onLoad="alert('hi');" />;
		expect(renderComponent(MOCK_PROPS, onLoadChild)).toMatchSnapshot();
		delete global.window;
	});
});
