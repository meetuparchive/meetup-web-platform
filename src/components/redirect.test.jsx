import React from 'react';
import ReactDOMServer from 'react-dom/server';
import StaticRouter from 'react-router-dom/StaticRouter';
import Redirect from './Redirect';

const renderToContext = to => {
	const context = {};

	ReactDOMServer.renderToString(
		<StaticRouter location={new URL('http://example.com')} context={context}>
			<Redirect to={to} />
		</StaticRouter>
	);
	return context;
};

describe('Server rendering', () => {
	it('sets React Router context for "local" redirect, nothing from Redirect.rewind()', () => {
		const internalTo = 'foo/bar';
		const httpContext = renderToContext(internalTo);
		expect(httpContext.url).toEqual(internalTo);
		expect(Redirect.rewind()).toBeUndefined();
	});
	it('provides external redirect URL from Redirect.rewind(), nothing from React Router context', () => {
		let externalTo = 'http://foo.com';
		const httpContext = renderToContext(externalTo);
		expect(httpContext.url).toBeUndefined();
		expect(Redirect.rewind()).toEqual(externalTo);

		externalTo = 'https://foo.com';
		const httpsContext = renderToContext(externalTo);
		expect(httpsContext.url).toBeUndefined();
		expect(Redirect.rewind()).toEqual(externalTo);
	});
	it('handles location object "to" props', () => {
		const externalTo = new URL('https://foo.com/foo');
		const httpsContext = renderToContext(externalTo);
		expect(httpsContext.url).toBeUndefined();
		expect(Redirect.rewind()).toEqual(externalTo.href);

		const internalTo = 'foo/bar';
		const httpContext = renderToContext(internalTo);
		expect(httpContext.url).toEqual(internalTo);
		expect(Redirect.rewind()).toBeUndefined();
	});
	it('returns undefined when no Redirect', () => {
		ReactDOMServer.renderToString(<div />);
		expect(Redirect.rewind()).toBeUndefined();
	});
});
