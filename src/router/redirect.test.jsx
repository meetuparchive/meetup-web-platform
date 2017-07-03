import React from 'react';
import ReactDOMServer from 'react-dom/server';
import StaticRouter from 'react-router-dom/StaticRouter';
import Redirect from './Redirect';

const renderToContext = (to, permanent) => {
	const context = {};

	ReactDOMServer.renderToString(
		<StaticRouter location={new URL('http://example.com')} context={context}>
			<Redirect to={to} permanent={permanent} />
		</StaticRouter>
	);
	return context;
};

describe('Server rendering', () => {
	it('sets React Router context for "local" redirect, nothing from Redirect.rewind()', () => {
		const internalTo = 'foo/bar';
		const httpContext = renderToContext(internalTo);
		expect(httpContext).toMatchObject({ url: internalTo });
		expect(httpContext.permanent).toBeUndefined();
		expect(Redirect.rewind()).toBeUndefined();
	});
	it('provides external redirect URL from Redirect.rewind(), nothing from React Router context', () => {
		let externalTo = 'http://foo.com'; // non-SSL
		const httpContext = renderToContext(externalTo);
		expect(httpContext.url).toBeUndefined();
		const externalRedirect = Redirect.rewind();
		expect(externalRedirect).toMatchObject({ url: externalTo });
		expect(externalRedirect.permanent).toBeUndefined();

		externalTo = 'https://foo.com'; // SSL
		const httpsContext = renderToContext(externalTo);
		expect(httpsContext.url).toBeUndefined();
		expect(Redirect.rewind()).toMatchObject({ url: externalTo });
	});
	it('handles location object "to" props', () => {
		const externalTo = new URL('https://foo.com/foo');
		const httpsContext = renderToContext(externalTo);
		expect(httpsContext.url).toBeUndefined();
		const externalRedirect = Redirect.rewind();
		expect(externalRedirect).toMatchObject({ url: externalTo.href });
		expect(externalRedirect.permanent).toBeUndefined();

		const internalTo = { pathname: '/foo/bar', search: '?foo=bar' };
		const httpContext = renderToContext(internalTo);
		expect(httpContext).toMatchObject({
			url: `${internalTo.pathname}${internalTo.search}`,
		});
		expect(httpContext.permanent).toBeUndefined();
		expect(Redirect.rewind()).toBeUndefined();
	});
	it('sets `permanent` on internal permanent redirect', () => {
		const internalTo = 'foo/bar';
		const permanent = true;
		const httpContext = renderToContext(internalTo, permanent);
		expect(httpContext).toMatchObject({ url: internalTo, permanent });
	});
	it('sets `permanent` on external permanent redirect', () => {
		const externalTo = 'https://foo.com'; // SSL
		const permanent = true;
		const httpsContext = renderToContext(externalTo, permanent);
		expect(httpsContext.url).toBeUndefined();
		expect(Redirect.rewind()).toMatchObject({ url: externalTo, permanent });
	});
	it('returns undefined when no Redirect', () => {
		ReactDOMServer.renderToString(<div />);
		expect(Redirect.rewind()).toBeUndefined();
	});
});
