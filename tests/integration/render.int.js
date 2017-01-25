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
					elapsedTime: 234,
					request: {
						uri: {
							query: 'foo=bar',
							pathname: '/foo',
						},
						method: 'get',
					},
				}, '{}'), 234)
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

const clientFilename = 'client.whatever.js';
const assetPublicPath = '//whatever';

const routes = {
	path: '/ny-tech',
	component: 'div',
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

const renderRequestMap = {
	'en-US': renderRequest$,
};

describe('Full dummy app render', () => {
	const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
	const mockConfig = () => Promise.resolve({
		API_HOST: 'www.api.meetup.com',
		CSRF_SECRET: random32,
		COOKIE_ENCRYPT_SECRET: random32,
		oauth: {
			key: random32,
			secret: random32,
		}
	});
	it('calls the handler for /{*wild}', () => {
		spyOn(global, 'fetch').and.returnValue(getMockFetch());
		return start(renderRequestMap, {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/ny-tech',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => expect(true).toBe(false)
				)
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
});


