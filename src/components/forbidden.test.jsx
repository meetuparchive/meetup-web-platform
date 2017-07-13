import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Forbidden from './Forbidden';

describe('Forbidden component', () => {
	it('returns a 403 status code', () => {
		ReactDOMServer.renderToString(<Forbidden />);
		expect(Forbidden.rewind()).toBe(403);
	});
});
