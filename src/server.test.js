import https from 'https';

import start from './server';
import config from './util/config';
import * as serverUtils from './util/serverUtils';

jest.mock('source-map-support');

const fooRoute = { path: '/foo' };
const fooPlugin = { register: 'foo' };
const routes = [fooRoute];
const plugins = [fooPlugin];


describe('start', () => {
	describe('rejectUnauthorized setting', function() {
		beforeEach(() => {
			// cache the 'default' setting for rejectUnauthorized
			this.defaultRejectUnauthorized = https.globalAgent.options.rejectUnauthorized;
		});

		afterEach(() => {
			// restore the default setting for rejectUnauthorized
			https.globalAgent.options.rejectUnauthorized = this.defaultRejectUnauthorized;
		});

		it('sets global rejectUnauthorized to false when using dev URLs in config', () => {
			config.set('isProd', false);
			config.set('isDev', true);
			start({}, { routes, plugins });
			expect(https.globalAgent.options.rejectUnauthorized).toBe(false);
		});

		it('sets global rejectUnauthorized to true when using prod URLs in config', () => {
			config.set('isProd', true);
			config.set('isDev', false);
			start({}, { routes, plugins });
			expect(https.globalAgent.options.rejectUnauthorized).toBe(true);
		});
	});

	describe('server', () => {
		it('resolves with the return value of serverUtils.server called with expected args', () => {
			const expectedServer = 'foo';

			expect(config).toBeDefined();
			expect(config).toEqual(jasmine.any(Object));

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
});

