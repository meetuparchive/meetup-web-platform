import Hapi from 'hapi';
import { plugin as loggerPlugin } from 'mwp-logger-plugin';
import { plugin, CLICK_PLUGIN_NAME, onPreHandlerExtension } from './click';

const mockClickReader = require('./util/clickReader');

jest.mock('./util/clickReader', () => jest.fn());
const h = { continue: Symbol('continue') };

describe('onPreHandlerExtension', () => {
	test('calls click test for settings.plugins', () => {
		mockClickReader.mockClear();
		const click = jest.fn(() => true);
		const request = {
			route: { settings: { plugins: { [CLICK_PLUGIN_NAME]: { click } } } },
		};
		const result = onPreHandlerExtension(request, h);
		expect(result).toBe(h.continue);
		expect(click).toHaveBeenCalledWith(request);
	});
	test('calls clickReader when click test passes', () => {
		mockClickReader.mockClear();
		const click = jest.fn(() => true);
		const request = {
			route: { settings: { plugins: { [CLICK_PLUGIN_NAME]: { click } } } },
		};
		onPreHandlerExtension(request, h);
		expect(mockClickReader).toHaveBeenCalledWith(request, h); // mocked
	});
	test('does not call clickReader when click test does not pass', () => {
		mockClickReader.mockClear();
		const click = jest.fn(() => false);
		const request = {
			route: { settings: { plugins: { [CLICK_PLUGIN_NAME]: { click } } } },
		};
		onPreHandlerExtension(request, h);
		expect(mockClickReader).not.toHaveBeenCalled();
	});
	describe('integration tests', () => {
		const injectRequest = {
			method: 'get',
			url: '/foo',
			auth: {
				credentials: {
					user: 'whatever',
				},
				strategy: 'bypass',
			},
		};
		const testRouteConfig = async route => {
			const server = new Hapi.Server();
			await server.route(route);
			await server.register([loggerPlugin, plugin]);
			await server.start();

			try {
				const response = await server.inject(injectRequest);
				await server.stop();
				return response;
			} catch (err) {
				expect(err).toBe(undefined);
				await server.stop();
			}
		};
		test('calls click test for settings.plugins', async () => {
			const click = jest.fn(() => true);
			mockClickReader.mockClear();
			const route = {
				method: 'GET',
				path: '/foo',
				options: {
					plugins: { [CLICK_PLUGIN_NAME]: { click } },
				},
				handler: () => 'okay',
			};
			const response = await testRouteConfig(route);
			expect(response.payload).toBe('okay');
			expect(click).toHaveBeenCalled();
			expect(mockClickReader).toHaveBeenCalled();
		});
		test('does not call clickReader if no route.options.plugins', async () => {
			const click = jest.fn(() => true);
			mockClickReader.mockClear();
			const route = {
				method: 'GET',
				path: '/foo',
				handler: () => 'okay',
			};
			const response = await testRouteConfig(route);
			expect(response.payload).toBe('okay');
			expect(click).not.toHaveBeenCalled();
			expect(mockClickReader).not.toHaveBeenCalled();
		});
	});
});
