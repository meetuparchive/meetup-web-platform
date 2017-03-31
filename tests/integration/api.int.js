import rison from 'rison';
import start from '../../src/server';
import {
	mockConfig,
} from '../mocks';
import * as apiProxyHandler from '../../src/apiProxy/apiProxyHandler';

jest.mock('request', () => {
	const mock = jest.fn(
		(requestOpts, cb) =>
			setTimeout(() => {
				console.log('calling callback');
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
	);
	mock.post = jest.fn();
	return mock;
});

describe('API proxy endpoint integration tests', () => {
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
					url: `/mu_api?queries=${rison.encode_array([{}])}`,
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
		const queries = rison.encode_array([{
			type: 'foo', params: {}, ref: 'foo', endpoint: 'foo'
		}]);
		return start({}, {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: `/mu_api?queries=${queries}`,
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

