import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import LogoutLink from './LogoutLink';

describe('NavItem', function() {
	beforeEach(function() {
		this.logoutLink = TestUtils.renderIntoDocument(<LogoutLink to='/' />);
		this.linkEl = ReactDOM.findDOMNode(this.logoutLink);
	});

	it('exists', function() {
		expect(this.linkEl).not.toBeNull();
	});

	it('creates an HTML a element', function() {
		expect(this.linkEl.nodeName).toBe('A');
	});

	xit('appends the logout query param', function() {
		expect(this.linkEl.getAttribute('href')).toEqual('/?logout');
	});

});
