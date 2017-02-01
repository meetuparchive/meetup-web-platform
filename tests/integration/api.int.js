import start from '../../src/server';
import * as apiProxyHandler from '../../src/apiProxy/apiProxyHandler';

jest.mock('request', () => {
	const mock = jest.fn(
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
	);
	mock.post = jest.fn();
	return mock;
});

describe('API proxy endpoint integration tests', () => {
	const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
	const mockConfig = () => Promise.resolve({
		API_HOST: 'www.api.meetup.com',
		OAUTH_ACCESS_URL: 'http://example.com/access',
		OAUTH_AUTH_URL: 'http://example.com/auth',
		CSRF_SECRET: random32,
		COOKIE_ENCRYPT_SECRET: random32,
		oauth: {
			key: random32,
			secret: random32,
		}
	});
	it('calls the GET handler for /mu_api', () => {
		const spyable = {
			handler: (request, reply) => reply('okay'),
		};
		spyOn(spyable, 'handler').and.callThrough();
		spyOn(apiProxyHandler, 'getApiProxyRouteHandler')
			.and.callFake(() => spyable.handler);
		return start({}, {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/mu_api?queries=[]',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => expect(spyable.handler).toHaveBeenCalled()
				)
				.then(() => server.stop());
			});
	});
	it('returns a formatted array of responses from GET /mu_api', () => {
		const expectedResponse = JSON.stringify({
			responses: [{
				foo: {
					type: 'foo',
					value: {},  // from the mocked `request` module
					meta: {
						endpoint: '/foo',
					},
				}
			}],
		});
		return start({}, {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/mu_api?queries=[{ "type": "foo", "params": {}, "ref": "foo", "endpoint": "foo" }]',
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

