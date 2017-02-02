import Boom from 'boom';
import csrf from 'electrode-csrf-jwt/lib/csrf';
import uuid from 'uuid';

import {
	mockConfig,
} from '../mocks';
import start from '../../src/server';
import * as apiProxyHandler from '../../src/apiProxy/apiProxyHandler';

jest.mock('request', () => {
	const mock = jest.fn(
		(requestOpts, cb) =>
			setTimeout(() =>
				cb(null, {
					headers: {},
					statusCode: 200,
					elapsedTime: 2,
					request: {
						uri: {
							pathname: '/foo',
						},
						method: 'post',
					},
				}, '{}'), 2)
	);
	mock.post = jest.fn();
	return mock;
});

const mockQuery = { type: 'foo', params: {}, ref: 'foo', endpoint: 'foo' };
const mockPostPayload = {
	queries: JSON.stringify([mockQuery])
};

function getCsrfHeaders() {
	const options = {
		secret:  'asdfasdfasdfasdfasdfasdfasdfasdf',
	};
	const id = uuid.v4();
	const headerPayload = {type: 'header', uuid: id};
	const cookiePayload = {type: 'cookie', uuid: id};

	return csrf.create(headerPayload, options)
		.then(headerToken => {
			return csrf.create(cookiePayload, options)
				.then(cookieToken => ([headerToken, cookieToken]));
		});
}
const runTest = (test, payload=mockPostPayload, csrfHeaders=getCsrfHeaders) => server =>
	csrfHeaders()
		.then(([headerToken, cookieToken]) => {
			const headers = {
				'x-csrf-jwt': headerToken,
				cookie: `x-csrf-jwt=${cookieToken}`,
			};
			const request = {
				method: 'post',
				url: '/mu_api',
				payload,
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
		spyOn(apiProxyHandler, 'getApiProxyRouteHandler')
			.and.callFake(() => spyable.handler);

		const test = response => expect(spyable.handler).toHaveBeenCalled();

		return start({}, {}, mockConfig)
			.then(runTest(test));
	});
	it('returns a formatted array of responses from POST /mu_api', () => {
		const expectedResponse = JSON.stringify({
			responses: [{
				[mockQuery.ref]: {
					type: mockQuery.type,
					value: {},  // from the mocked `request` module
					meta: {
						endpoint: '/foo',
					},
				}
			}],
		});
		const test = response => expect(response.payload).toEqual(expectedResponse);

		return start({}, {}, mockConfig)
			.then(runTest(test));
	});
	it('return a an object with an error key when CSRF is invalid', () => {
		const expectedPayload = JSON.stringify(Boom.create(400, 'INVALID_JWT').output.payload);
		const test = response => expect(response.payload).toEqual(expectedPayload);
		const csrfHeaders = () => getCsrfHeaders().then(([cookieToken, headerToken]) => ([cookieToken, '']));

		return start({}, {}, mockConfig)
			.then(runTest(test, mockConfig, csrfHeaders));
	});
});

