import getRoutes from './';
import { getServer } from 'mwp-test-utils';

async function getResponse(injectRequest) {
	// async/await that returns the server instance after it has been
	// configured with the routes being tested
	const routes = getRoutes();
	const server = await getServer();

	await server.route(routes);

	const response = await server.inject(injectRequest);

	return response;
}

describe('routes', () => {
	it('serves the ping route', async () => {
		const response = await getResponse({ url: '/ping' });
		expect(response.statusCode).toEqual(200);
	});

	it('serves the app engine lifecycle route', async () => {
		const response = await getResponse({ url: '/_ah/start' });
		expect(response.statusCode).toEqual(200);
	});
});
