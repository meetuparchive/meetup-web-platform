import jsdom from 'jsdom';
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.document = doc;
global.window = doc.defaultView;

import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import connectedWithMatchMedia from './connectedWithMatchMedia';

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

const TestComponent = () => <div>Hello World</div>;
const TestComponentConnectedWithMatchMedia = connectedWithMatchMedia(
	TestComponent
);

const MATCH_MEDIA_FN_MOCK = mq => ({
	matches: false,
	addListener: jest.fn(),
	removeListener: jest.fn(),
});

describe('connectedWithMatchMedia', () => {
	const mockStore = createFakeStore({
		config: { media: { isAtSmallUp: true } },
	});
	console.log('hi');
	const connectedWithMatchMedia = shallow(
		<TestComponentConnectedWithMatchMedia />,
		{context: {store: mockStore}}
	);
	it('exists', () => {
		expect(connectedWithMatchMedia).toMatchSnapshot();
	});
});
