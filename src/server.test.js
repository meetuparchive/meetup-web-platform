import start from './server';
import config from './util/config';
import * as serverUtils from './util/serverUtils';

jest.mock('source-map-support');

describe('server', () => {
	it('resolves with the return value of serverUtils.server called with expected args', () => {
		const expectedServer = 'foo';
		const fooRoute = { path: '/foo' };
		const fooPlugin = { register: 'foo' };
		const routes = [fooRoute];
		const plugins = [fooPlugin];
		spyOn(serverUtils, 'server').and.returnValue(Promise.resolve(expectedServer));
		return start({}, { routes, plugins }).then(returnedServer => {
			const callArgs = serverUtils.server.calls.mostRecent().args;
			expect(callArgs).toEqual([
				jasmine.any(Array),    // routes
				jasmine.any(Object),   // connection
				jasmine.any(Array),    // plugins
				jasmine.any(String),   // platform_agent
			]);
			expect(callArgs[0].indexOf(fooRoute)).toBeGreaterThan(-1);
			expect(callArgs[2].indexOf(fooPlugin)).toBeGreaterThan(-1);
			expect(returnedServer).toBe(expectedServer);
		});
	});
});

