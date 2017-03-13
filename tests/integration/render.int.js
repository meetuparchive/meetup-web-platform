import {
	getMockRenderRequestMap,
	mockConfig,
} from '../mocks';
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

const expectedOutputMessage = 'Looking good';

describe('Full dummy app render', () => {
	it('calls the handler for /{*wild}', () => {
		return start(getMockRenderRequestMap(), {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/ny-tech?heyhey=true',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => {
						expect(response.payload).toContain(expectedOutputMessage);
						expect(
							response.headers['set-cookie'].find(h => h.startsWith('x-csrf-jwt-header'))
						).not.toBeUndefined();
					}
				)
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
});

