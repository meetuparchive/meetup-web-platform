import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';
import StaticRouter from 'react-router-dom/StaticRouter';
import Link from './Link';

const render = props => {
	const wrapped = (
		<StaticRouter location={new URL('http://example.com')} context={{}}>
			<Link {...props} />
		</StaticRouter>
	);
	return {
		json: renderer.create(wrapped).toJSON(), // for snapshots
		shallow: shallow(wrapped), // for enzyme shallow render inspection
	};
};

describe('Server rendering', () => {
	const internalToString = '/foo/bar';
	const internalToLoc = {
		pathname: '/foo/bar',
	};
	const externalToString = 'http://example.com/foo/bar';
	const externalToUrl = new URL('http://example.com/foo/bar');
	it('Renders a react-router <Link> for internal route string', () => {
		const rendered = render({ to: internalToString });
		const link = rendered.shallow.find('Link');
		expect(link.exists()).toBe(true);
		expect(link.props().to).toBe(internalToString);
	});
	it('Renders a react-router <Link> for internal route object', () => {
		const rendered = render({ to: internalToLoc });
		const link = rendered.shallow.find('Link');
		expect(link.exists()).toBe(true);
		expect(link.props().to).toBe(internalToLoc);
	});
	it('Renders a valid link for external URL string', () => {
		expect(render({ to: externalToString }).json).toMatchSnapshot();
	});
	it('Renders a valid link for external URL object', () => {
		expect(render({ to: externalToUrl }).json).toMatchSnapshot();
	});
});
