import {
	getMockFetch,
	getMockRenderRequestMap,
	mockConfig,
} from '../mocks';
import start from '../../src/server';
import { fooPathContent } from '../MockContainer';

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
				}, '{}');
			}, 2)
	)
);

describe('Full dummy app render', () => {
	it('calls the handler for /{*wild}', () => {
		const fakeApiProxyResponse = 'value from api proxy';
		spyOn(global, 'fetch').and.returnValue(
			getMockFetch({ responses: [{ foo: { value: fakeApiProxyResponse } }] })
		);
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/foo',
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

