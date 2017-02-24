import {
	getMockFetch,
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

describe('Full dummy app render', () => {
	it('renders the expected app content for nested path of mock app route config', () => {
		const fakeApiProxyResponse = 'value from api proxy';
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/foo/bar',
					credentials: 'whatever',
				};
				return server.inject(request).then(response => {
					expect(response.payload).toContain(fooPathContent);
					expect(response.payload).toContain(fakeApiProxyResponse);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
});

