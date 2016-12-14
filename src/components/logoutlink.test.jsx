import React from 'react';
import Link from 'react-router/lib/Link';
import TestUtils from 'react-addons-test-utils';
import LogoutLink from './LogoutLink';

const renderer = TestUtils.createRenderer();
const MOCK_LOGOUT_TO_QUERY = {
	logout: true
};

describe('LogoutLink', function() {
	let tree;

	beforeEach(function() {
		renderer.render(<LogoutLink to='/' />);
		tree = renderer.getRenderOutput();
	});

	it('exists', function() {
		expect(tree).not.toBeNull();
	});

	it('creates a Link element with a logout to prop', function() {
		expect(tree.type).toEqual(Link);
		expect(tree.props.to.pathname).toEqual('/');
		expect(tree.props.to.query).toEqual(MOCK_LOGOUT_TO_QUERY);
	});
});
