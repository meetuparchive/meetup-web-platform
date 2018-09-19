import React from 'react';
import { shallow } from 'enzyme';
import UXCaptureEventMark from './UXCaptureEventMark';

const MOCK_PROPS = {
	browserEvent: 'onLoad',
	mark: 'ux-image-load-logo',
};

const renderComponent = (props = MOCK_PROPS) =>
	shallow(
		<UXCaptureEventMark {...props}>
			<img src="/foo" />
		</UXCaptureEventMark>
	);

describe('UXCaptureEventMark', () => {
	it('renders component markup', () => {
		expect(renderComponent()).toMatchSnapshot();
	});
});
