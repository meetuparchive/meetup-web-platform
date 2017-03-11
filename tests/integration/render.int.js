import {
	ROOT_INDEX_CONTENT,
	FOO_INDEX_CONTENT,
} from '../mockApp';
import {
	getMockRenderRequestMap,
	mockConfig,
} from '../mocks';
import start from '../../src/server';
import { fooPathContent } from '../MockContainer';

// mock request just to ensure no external calls are made
// ** Use getMockFetch to mock an API endpoint response **
jest.mock('request', () =>
	jest.fn(
		(requestOpts, cb) =>
			setTimeout(() => {
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
				}, '{ "foo": "value from api proxy" }');
			}, 2)
	)
);
const fakeApiProxyResponse = 'value from api proxy';

describe('Full dummy app render', () => {
	it('renders the expected app content for nested path of mock app route config', () => {
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/foo/bar?heyhey=true',
					credentials: 'whatever',
				};
				return server.inject(request).then(response => {
					expect(response.payload).not.toContain(ROOT_INDEX_CONTENT);
					expect(response.payload).toContain(fakeApiProxyResponse);
					expect(
						response.headers['set-cookie'].find(h => h.startsWith('x-csrf-jwt-header'))
					).not.toBeUndefined();
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
	it('renders the expected root index route app content at `/`', () => {
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/',
					credentials: 'whatever',
				};
				return server.inject(request).then(response => {
					expect(response.payload).not.toContain(fooPathContent);
					expect(response.payload).toContain(ROOT_INDEX_CONTENT);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
	it('renders the expected child index route app content at `/foo`', () => {
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/foo',
					credentials: 'whatever',
				};
				return server.inject(request).then(response => {
					expect(response.payload).not.toContain(fooPathContent);
					expect(response.payload).toContain(FOO_INDEX_CONTENT);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
});

