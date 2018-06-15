// @flow
import React from 'react';
import { shallow } from 'enzyme';
import { StateBroadcastComponent } from './StateBroadcast';

test('Does not render', () => {
	global.window = {};
	expect(shallow(<StateBroadcastComponent state={{}} />)).toMatchSnapshot();
});
test('adds a getAppState function to window', () => {
	global.window = {};
	const mockState = { foo: 'bar' };
	shallow(<StateBroadcastComponent state={mockState} />);
	expect(global.window.getAppState).toEqual(expect.any(Function));
	expect(global.window.getAppState()).toBe(mockState);
});
