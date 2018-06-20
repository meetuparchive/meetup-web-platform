import rison from 'rison';
import requestAuthPlugin from 'mwp-auth-plugin';
import CsrfPlugin from 'electrode-csrf-jwt';

import { getServer } from 'mwp-test-utils';
import apiProxyPlugin from './';

jest.mock('mwp-config', () => {
	const config = require.requireActual('mwp-config');
	config.package = { agent: 'TEST_AGENT ' };
	return config;
});

async function getResponse(injectRequest, server = getServer()) {
	// returns the server instance after it has been configured with the routes being tested
	await server.register([
		{
			register: requestAuthPlugin,
		},
		{
			register: CsrfPlugin,
			options: { secret: 'asfd' },
		},
		{
			register: apiProxyPlugin,
		},
	]);

	await server.auth.strategy('default', 'mwp', true);

	await server.inject(injectRequest);

	return server;
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

		// little helper function to test various matchable proxy URLs
		const testUrl = url =>
			getResponse({ url }).then(response => {
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
		return testUrl(`/mu_api?queries=${queriesRison}`).then(() =>
			testUrl(`/mu_api/another/arbitrary/path/?queries=${queriesRison}`)
		);
	});
});
