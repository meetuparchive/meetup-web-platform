import start from '../../src/server';

jest.mock('request', () =>
	jest.fn(
		(requestOpts, cb) =>
			setTimeout(() =>
				cb(null, {
					headers: {},
					statusCode: 200,
					elapsedTime: 1234,
					request: {
						uri: {
							query: 'foo=bar',
							pathname: '/foo',
						},
						method: 'get',
					},
				}, '{}'), 200)
	)
);

describe('API proxy endpoint integration tests', () => {
	const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
	const mockConfig = () => Promise.resolve({
		CSRF_SECRET: random32,
		COOKIE_ENCRYPT_SECRET: random32,
		oauth: {
			key: random32,
			secret: random32,
		}
	});
	it('calls the handler for /api', () => {
		const expectedResponse = JSON.stringify({
			responses: [{}],
		});
		return start({}, {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/api?queries=[{}]',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => expect(response.payload).toEqual(expectedResponse)
				)
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
			});
	});
});

