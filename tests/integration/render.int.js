import { mockConfig } from '../mocks';
import React from 'react';
import makeRenderer from '../../src/renderers/server-render';
import makeRootReducer from '../../src/reducers/platform';

import start from '../../src/server';

jest.mock('request', () =>
	jest.fn(
		(requestOpts, cb) =>
			setTimeout(() =>
				cb(null, {
					headers: {},
					statusCode: 200,
					elapsedTime: 2,
					request: {
						uri: {
							query: 'foo=bar',
							pathname: '/foo',
						},
						method: 'get',
					},
				}, '{}'), 2)
	)
);

const getMockFetch = (mockResponseValue=[{}], headers={}) =>
	Promise.resolve({
		text: () => Promise.resolve(JSON.stringify(mockResponseValue)),
		json: () => Promise.resolve(mockResponseValue),
		headers: {
			get: key => headers[key],
		},
	});

const expectedOutputMessage = 'Looking good';

const getMockRenderRequestMap = () => {
	const clientFilename = 'client.whatever.js';
	const assetPublicPath = '//whatever';

	const TestRenderComponent = props => <div>{expectedOutputMessage}</div>;

	const routes = {
		path: '/ny-tech',
		component: TestRenderComponent,
		query: () => ({}),
	};
	const reducer = makeRootReducer();

	const basename = '/';

	const renderRequest$ = makeRenderer(
		routes,
		reducer,
		clientFilename,
		assetPublicPath,
		[],
		basename
	);

	return {
		'en-US': renderRequest$,
	};
};

describe('Full dummy app render', () => {
	it('calls the handler for /{*wild}', () => {
		spyOn(global, 'fetch').and.returnValue(getMockFetch());
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/ny-tech',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => expect(response.payload).toContain(expectedOutputMessage)
				)
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
});


