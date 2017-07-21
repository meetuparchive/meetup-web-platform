import {
	MOCK_renderRequestMap,
	MOCK_RENDER_RESULT,
} from 'meetup-web-mocks/lib/app';

import getRoutes from './routes';
import { getServer } from './util/testUtils';

function getResponse(injectRequest, server = getServer()) {
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	const routes = getRoutes(MOCK_renderRequestMap);
	server.route(routes);
	return server.inject(injectRequest);
}

describe('routes', () => {
	it('serves the homepage route', () =>
		getResponse({ url: '/' }).then(response =>
			expect(response.payload).toEqual(MOCK_RENDER_RESULT)
		));
});
