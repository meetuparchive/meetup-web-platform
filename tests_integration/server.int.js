import start from '../src/server';
import * as apiProxyHandler from '../src/apiProxy/apiProxyHandler';
import * as appRouteHandler from '../src/routes/appRouteHandler';

describe('Integration tests', () => {
	const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
	const mockConfig = () => Promise.resolve({
		CSRF_SECRET: random32,
		COOKIE_ENCRYPT_SECRET: random32,
		oauth: {
			key: random32,
			secret: random32,
		}
	});
	it('starts the server', () => {
		const fooRoute = {
			method: 'get',
			path: '/foo',
			handler: (request, reply) => reply('okay')
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig)
			.then(returnedServer => returnedServer.stop());
	});
	it('calls the handler for an unauthenticated route', () => {
		const expectedResponse = 'okay';
		const fooRoute = {
			method: 'get',
			path: '/foo',
			config: {
				auth: false,
			},
			handler: (request, reply) => reply(expectedResponse)
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig)
			.then(server => {
				const requestFooRoute = {
					method: 'get',
					url: '/foo',
				};
				return server.inject(requestFooRoute).then(
					response => expect(response.payload).toEqual(expectedResponse)
				)
				.then(() => server.stop());
			});
	});
	it('calls the handler for an authenticated route', () => {
		const expectedResponse = 'okay';
		const fooRoute = {
			method: 'get',
			path: '/foo',
			handler: (request, reply) => reply(expectedResponse)
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig)
			.then(server => {
				const authedRequestFooRoute = {
					method: 'get',
					url: '/foo',
					credentials: 'whatever',
				};
				return server.inject(authedRequestFooRoute).then(
					response => expect(response.payload).toEqual(expectedResponse)
				)
				.then(() => server.stop());
			});
	});
	it('calls the handler for /api', () => {
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
					url: '/api?queries=[]',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => expect(spyable.handler).toHaveBeenCalled()
				)
				.then(() => server.stop());
			});
	});
	it('calls the handler for /api', () => {
		const spyable = {
			handler: (request, reply) => reply('okay'),
		};
		spyOn(spyable, 'handler').and.callThrough();
		spyOn(appRouteHandler, 'getAppRouteHandler')
			.and.callFake(() => spyable.handler);
		return start({}, {}, mockConfig)
			.then(server => {
				const request = {
					method: 'get',
					url: '/ny-tech',
					credentials: 'whatever',
				};
				return server.inject(request).then(
					response => expect(spyable.handler).toHaveBeenCalled()
				)
				.then(() => server.stop());
			});
	});
});

