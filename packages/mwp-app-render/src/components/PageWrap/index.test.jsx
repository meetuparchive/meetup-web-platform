import React from 'react';
import jsdom from 'jsdom';

import { shallow } from 'enzyme';
import { MOCK_MEMBER } from 'meetup-web-mocks/lib/api';

import PageWrap from './';

const PROPS = {
	localeCode: 'en-US',
	self: MOCK_MEMBER,
	location: {
		hash: '',
		pathname: '/',
		search: '',
	},
};

describe('PageWrap', () => {
	it('renders correct UI elements', () => {
		const doc = jsdom.jsdom(
			'<!doctype html><html><head></head><body></body></html>'
		);
		global.document = doc;
		global.window = { newrelic: { addToTrace: jest.fn() } };
		expect(
			shallow(
				<PageWrap {...PROPS}>
					<div>hello world</div>
				</PageWrap>
			)
		).toMatchSnapshot();
		delete global.window;
	});
	it('Calls NR trace in componentDidMount', () => {
		const doc = jsdom.jsdom(
			'<!doctype html><html><head></head><body></body></html>'
		);
		global.document = doc;
		global.window = { newrelic: { addToTrace: jest.fn() } };
		shallow(<PageWrap {...PROPS} />).instance().componentDidMount();
		expect(global.window.newrelic.addToTrace).toHaveBeenCalled();
		delete global.window;
	});
});
