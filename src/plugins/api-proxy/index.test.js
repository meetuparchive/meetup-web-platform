import rison from 'rison';
import {
	getRequestAuthPlugin,
	getApiProxyPlugin,
	getCsrfPlugin,
} from '../../plugins';

import { getServer } from '../../util/testUtils';

function getResponse(injectRequest, server = getServer()) {
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	return server
		.register([getRequestAuthPlugin(), getCsrfPlugin(), getApiProxyPlugin()])
		.then(() => server.inject(injectRequest));
}
describe('api proxy plugin', () => {
	it('serves api responses from the configured route path', () => {
		const endpoint = 'foo';
		const expectedResponse = { foo: 'bar' };
		require('request').__setMockResponse(
			null,
			JSON.stringify(expectedResponse)
		);
		const validQuery = { type: 'a', ref: 'b', params: {}, endpoint };
		const queriesRison = rison.encode_array([validQuery]);
		return getResponse({
			url: `/mu_api?queries=${queriesRison}`,
			headers: {
				cookie: 'oauth_token=asdf',
			},
		}).then(response => {
			expect(response.statusCode).toBe(200);
			expect(JSON.parse(response.payload)).toMatchObject({
				responses: [
					expect.objectContaining({
						meta: { statusCode: 200, endpoint: `/${endpoint}` },
						value: expectedResponse,
					}),
				],
			});
		});
	});
});
