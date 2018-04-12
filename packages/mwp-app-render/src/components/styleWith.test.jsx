import React from 'react';
import { shallow } from 'enzyme';
import StyleWith from './StyleWith';

const MOCK_PROPS = {
	styles: [
		{ _getCss: () => '.testClass1 {color: inherit;}' },
		{ _getCss: () => '.testClass2 {page-break-after: avoid;}' },
	],
};

describe('StyleWith', function() {
	it('renders with mock props', function() {
		expect(shallow(<StyleWith {...MOCK_PROPS} />)).toMatchSnapshot();
	});
});
