import rison from 'rison';
import requestAuthPlugin from 'mwp-auth-plugin';
import apiProxyPlugin from 'mwp-api-proxy-plugin';
import CsrfPlugin from 'electrode-csrf-jwt';

import { getServer } from 'mwp-test-utils';

jest.mock('mwp-cli/src/config', () => {
	const config = require.requireActual('mwp-cli/src/config');
	config.package = { agent: 'TEST_AGENT ' };
	return config;
});

function getResponse(injectRequest, server = getServer()) {
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	return server
		.register([
			requestAuthPlugin,
			{ register: CsrfPlugin, options: { secret: 'asfd' } },
			apiProxyPlugin,
		])
		.then(() => server.auth.strategy('default', 'mwp', true))
		.then(() => server.inject(injectRequest));
}
describe('api proxy plugin', () => {
	it('serves api responses from the configured route path', () => {
		const endpoint = 'foo';
		const validQuery = { type: 'a', ref: 'b', params: {}, endpoint };
		const expectedResponse = { foo: 'bar' };
		require('request').__setMockResponse(
			null,
			JSON.stringify(expectedResponse)
		);
		const queriesRison = rison.encode_array([validQuery]);
		return getResponse({
			url: `/mu_api?queries=${queriesRison}`,
		}).then(response => {
			expect(response.statusCode).toBe(200);
			expect(JSON.parse(response.payload)).toMatchObject({
				responses: [
					expect.objectContaining({
						meta: { statusCode: 200, endpoint },
						value: expectedResponse,
					}),
				],
			});
		});
	});
});
