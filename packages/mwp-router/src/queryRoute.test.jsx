import React from 'react';
import { shallow } from 'enzyme';
import { QueryRoute } from './QueryRoute';

const Dummy = () => <div>Hi</div>;

describe('QueryRoute', () => {
	it('renders child when querystring contains param, no value specified', () => {
		expect(
			shallow(
				<QueryRoute param="foo" location={{ search: '?foo' }}>
					<Dummy />
				</QueryRoute>
			)
		).toMatchSnapshot();
		expect(
			shallow(
				<QueryRoute param="foo" location={{ search: '?foo=bar' }}>
					<Dummy />
				</QueryRoute>
			)
		).toMatchSnapshot();
		expect(
			shallow(
				<QueryRoute param="foo" location={{ search: '?bar&foo' }}>
					<Dummy />
				</QueryRoute>
			)
		).toMatchSnapshot();
	});
	it('renders child when querystring contains param with specified value', () => {
		expect(
			shallow(
				<QueryRoute param="foo" value="bar" location={{ search: '?foo=bar' }}>
					<Dummy />
				</QueryRoute>
			)
		).toMatchSnapshot();
		expect(
			shallow(
				<QueryRoute
					param="foo"
					value="bar"
					location={{ search: '?qux&foo=bar' }}
				>
					<Dummy />
				</QueryRoute>
			)
		).toMatchSnapshot();
	});
	it('does not render anything when no matching param', () => {
		expect(
			shallow(
				<QueryRoute param="foo" location={{ search: '' }}>
					<Dummy />
				</QueryRoute>
			).isEmptyRender()
		).toBe(true);
		expect(
			shallow(
				<QueryRoute param="foo" location={{ search: '?bar' }}>
					<Dummy />
				</QueryRoute>
			).isEmptyRender()
		).toBe(true);
		expect(
			shallow(
				<QueryRoute param="foo" location={{ search: '?bar&food' }}>
					<Dummy />
				</QueryRoute>
			).isEmptyRender()
		).toBe(true);
	});
	it('does not render anything when specified param has non-matching value', () => {
		expect(
			shallow(
				<QueryRoute param="foo" value="bar" location={{ search: '?foo=qux' }}>
					<Dummy />
				</QueryRoute>
			).isEmptyRender()
		).toBe(true);
		expect(
			shallow(
				<QueryRoute
					param="foo"
					value="bar"
					location={{ search: '?foo=barn&food=bar' }}
				>
					<Dummy />
				</QueryRoute>
			).isEmptyRender()
		).toBe(true);
	});
});
