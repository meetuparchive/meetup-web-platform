import React from 'react';
import { shallow } from 'enzyme';
import connectWithMatchMedia from './connectWithMatchMedia';

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

const TestComponent = () => <div>Hello World</div>;
const TestComponentConnectWithMatchMedia = connectWithMatchMedia(TestComponent);

describe('connectWithMatchMedia', () => {
	const mockStore = createFakeStore({
		config: { media: { isAtSmallUp: true } },
	});
	const connectWithMatchMedia = shallow(
		<TestComponentConnectWithMatchMedia />,
		{
			context: { store: mockStore },
		}
	);
	it('exists', () => {
		expect(connectWithMatchMedia).toMatchSnapshot();
	});
});
