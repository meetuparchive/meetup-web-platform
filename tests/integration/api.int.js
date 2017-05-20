import querystring from 'querystring';
import Boom from 'boom';
import rison from 'rison';
import { getCsrfHeaders } from '../mocks';
import start from '../../src/server';
import * as apiProxyHandler from '../../src/apiProxy/apiProxyHandler';

/*
 * BEGIN 'GET' TESTS
 */
require('request').__setMockResponse(
	{
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
	},
	'{}'
);

describe('API proxy endpoint integration tests', () => {
	it('calls the GET handler for /mu_api', () => {
		const spyable = {
			handler: (request, reply) => reply('okay'),
		};
		spyOn(spyable, 'handler').and.callThrough();
		spyOn(apiProxyHandler, 'getApiProxyRouteHandler').and.callFake(
			() => spyable.handler
		);
		return start({}, {}).then(server => {
			const request = {
				method: 'get',
				url: `/mu_api?queries=${rison.encode_array([{}])}`,
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => expect(spyable.handler).toHaveBeenCalled())
				.then(() => server.stop());
		});
	});
	it('returns a formatted array of responses from GET /mu_api', () => {
		const expectedResponse = {
			responses: [
				{
					ref: 'foo',
					type: 'foo',
					value: {}, // from the mocked `request` module
					meta: {
						endpoint: '/foo',
						statusCode: 200,
					},
				},
			],
		};
		const queries = rison.encode_array([
			{
				type: 'foo',
				params: {},
				ref: 'foo',
				endpoint: 'foo',
			},
		]);
		return start({}, {}).then(server => {
			const request = {
				method: 'get',
				url: `/mu_api?queries=${queries}`,
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response =>
					expect(JSON.parse(response.payload)).toEqual(
						expectedResponse
					)
				)
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
});

/*
 * BEGIN 'POST' TESTS
 */
require('request').__setMockResponse(
	{
		headers: {},
		statusCode: 200,
		elapsedTime: 2,
		request: {
			uri: {
				pathname: '/foo',
			},
			method: 'post',
		},
	},
	'{}'
);

const mockQuery = { type: 'foo', params: {}, ref: 'foo', endpoint: 'foo' };
const mockPostPayload = {
	queries: rison.encode_array([mockQuery]),
};

const runTest = (test, csrfHeaders = getCsrfHeaders) => server =>
	csrfHeaders()
		.then(([headerToken, cookieToken]) => {
			const headers = {
				'x-csrf-jwt': headerToken,
				'content-type': 'application/x-www-form-urlencoded',
				cookie: `x-csrf-jwt=${cookieToken}`,
			};
			const request = {
				method: 'post',
				url: '/mu_api',
				payload: querystring.stringify(mockPostPayload),
				credentials: 'whatever',
				headers,
			};
			return server.inject(request);
		})
		.then(test)
		.then(() => server.stop())
		.catch(err => {
			server.stop();
			throw err;
		});

describe('API proxy POST endpoint integration tests', () => {
	it('calls the POST handler for /mu_api', () => {
		const spyable = {
			handler: (request, reply) => reply('okay'),
		};
		spyOn(spyable, 'handler').and.callThrough();
		spyOn(apiProxyHandler, 'getApiProxyRouteHandler').and.callFake(
			() => spyable.handler
		);

		const test = response => expect(spyable.handler).toHaveBeenCalled();

		return start({}, {}).then(runTest(test));
	});
	it('returns a formatted array of responses from POST /mu_api', () => {
		const expectedResponse = {
			responses: [
				{
					ref: mockQuery.ref,
					type: mockQuery.type,
					value: {}, // from the mocked `request` module
					meta: {
						endpoint: '/foo',
						statusCode: 200,
					},
				},
			],
		};
		const test = response =>
			expect(JSON.parse(response.payload)).toEqual(expectedResponse);

		return start({}, {}).then(runTest(test));
	});
	it('return a an object with an error key when CSRF is invalid', () => {
		const expectedPayload = JSON.stringify(
			Boom.create(400, 'INVALID_JWT').output.payload
		);
		const test = response =>
			expect(response.payload).toEqual(expectedPayload);
		const csrfHeaders = () =>
			getCsrfHeaders().then(([cookieToken, headerToken]) => [
				cookieToken,
				'',
			]);

		return start({}, {}).then(runTest(test, csrfHeaders));
	});
});

/*
 *
 */
