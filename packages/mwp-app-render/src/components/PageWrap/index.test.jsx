import React from 'react';

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
		global.window = {};
		expect(
			shallow(
				<PageWrap {...PROPS}>
					<div>hello world</div>
				</PageWrap>
			)
		).toMatchSnapshot();
		delete global.window;
	});
});
