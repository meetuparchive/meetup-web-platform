import getRoutes from './routes';
import { getServer } from './util/testUtils';

function getResponse(injectRequest, server = getServer()) {
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	const routes = getRoutes();
	server.route(routes);
	return server.inject(injectRequest);
}

describe('routes', () => {
	it('serves the ping route', () =>
		getResponse({ url: '/ping' }).then(response =>
			expect(response.statusCode).toEqual(200)
		));
	it('serves the app engine lifecycle route', () =>
		getResponse({ url: '/_ah/start' }).then(response =>
			expect(response.statusCode).toEqual(200)
		));
});
