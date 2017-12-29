import jsdom from 'jsdom';
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.document = doc;
global.window = doc.defaultView;

import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import connectWithMatchMedia from './connectWithMatchMedia';

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

const TestComponent = () => <div>Hello World</div>;
const TestComponentConnectWithMatchMedia = connectWithMatchMedia(
	TestComponent
);

const MATCH_MEDIA_FN_MOCK = mq => ({
	matches: false,
	addListener: jest.fn(),
	removeListener: jest.fn(),
});

describe('connectWithMatchMedia', () => {
	const mockStore = createFakeStore({
		config: { media: { isAtSmallUp: true } },
	});
	const connectWithMatchMedia = shallow(
		<TestComponentConnectWithMatchMedia />,
		{ context: { store: mockStore } }
	);
	it('exists', () => {
		expect(connectWithMatchMedia).toMatchSnapshot();
	});
});
