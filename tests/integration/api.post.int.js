import Boom from 'boom';
import csrf from 'electrode-csrf-jwt/lib/csrf';
import uuid from 'uuid';
import start from '../../src/server';
import * as apiProxyHandler from '../../src/apiProxy/apiProxyHandler';

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
							pathname: '/foo',
						},
						method: 'post',
					},
				}, '{}'), 234)
	)
);


const mockQuery = { type: 'foo', params: {}, ref: 'foo', endpoint: 'foo' };
const mockPostPayload = {
	queries: JSON.stringify([mockQuery])
};

const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
function getCsrfHeaders() {
	const options = {
		secret: random32,
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
				url: '/api',
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
	const mockConfig = () => Promise.resolve({
		API_HOST: 'www.api.meetup.com',
		CSRF_SECRET: random32,
		COOKIE_ENCRYPT_SECRET: random32,
		oauth: {
			key: random32,
			secret: random32,
		}
	});
	it('calls the POST handler for /api', () => {
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
	it('returns a formatted array of responses from POST /api', () => {
		const expectedResponse = JSON.stringify({
			responses: [{
				[mockQuery.ref]: {
					type: mockQuery.type,
					value: {},  // from the mocked `request` module
					meta: {
						flags: {},
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

