import start from './server';
import * as serverUtils from './util/serverUtils';
import * as config from './util/config';

jest.mock('source-map-support');

describe('server', () => {
	it('resolves with the return value of serverUtils.server called with expected args', () => {
		const expectedServer = 'foo';
		const fooRoute = { path: '/foo' };
		const fooPlugin = { register: 'foo' };
		const routes = [fooRoute];
		const plugins = [fooPlugin];
		spyOn(serverUtils, 'server').and.returnValue(Promise.resolve(expectedServer));
		spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes, plugins }).then(returnedServer => {
			const callArgs = serverUtils.server.calls.mostRecent().args;
			expect(callArgs).toEqual([
				jasmine.any(Array),    // routes
				jasmine.any(Object),   // connection
				jasmine.any(Array),    // plugins
				jasmine.any(String),   // platform_agent
				jasmine.any(Object),   // config
			]);
			expect(callArgs[0].indexOf(fooRoute)).toBeGreaterThan(-1);
			expect(callArgs[2].indexOf(fooPlugin)).toBeGreaterThan(-1);
			expect(returnedServer).toBe(expectedServer);
		});
	});
	describe('Component tests', () => {
		it('starts the server', () => {
			const fooRoute = {
				method: 'get',
				path: '/foo',
				handler: (request, reply) => reply('okay')
			};
			const routes = [fooRoute];
			// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
			return start({}, { routes })
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
			return start({}, { routes })
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
			return start({}, { routes })
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
	});
});

