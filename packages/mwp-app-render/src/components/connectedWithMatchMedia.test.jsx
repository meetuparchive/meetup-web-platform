import jsdom from 'jsdom';
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.document = doc;
global.window = doc.defaultView;

import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import connectedWithMatchMedia from './connectedWithMatchMedia';

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

const TestComponent = () => (<div>Hello World</div>);
const TestComponentConnectedWithMatchMedia = connectedWithMatchMedia(TestComponent);

const MATCH_MEDIA_FN_MOCK = mq => ({
	matches: false,
	addListener: jest.fn(),
	removeListener: jest.fn(),
});

describe('connectedWithMatchMedia', () => {
	const mockStore = createFakeStore({config: {device: {isMobile: true} } })
	const connectedWithMatchMedia = mount(
		<Provider store={mockStore}>
			<TestComponentConnectedWithMatchMedia />
		</Provider>
	);
	it('exists', () => {
		expect(connectedWithMatchMedia).toMatchSnapshot();
	});
});
