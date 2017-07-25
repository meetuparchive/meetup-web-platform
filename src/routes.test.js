import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import rison from 'rison';
import {
	MOCK_API_RESULT,
	MOCK_renderRequestMap,
	MOCK_RENDER_RESULT,
} from 'meetup-web-mocks/lib/app';

import getRoutes from './routes';
import { getServer } from './util/testUtils';

function getResponse(injectRequest, server = getServer()) {
	const MOCK_API_PROXY$ = () => Observable.of(MOCK_API_RESULT);
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	const routes = getRoutes(MOCK_renderRequestMap, MOCK_API_PROXY$);
	server.route(routes);
	return server.inject(injectRequest);
}

describe('routes', () => {
	it('serves the homepage route', () =>
		getResponse({ url: '/' }).then(response =>
			expect(response.payload).toEqual(MOCK_RENDER_RESULT)
		));
	it('serves the api route', () => {
		const validQuery = { type: 'a', ref: 'b', params: {} };
		const queriesRison = rison.encode_array([validQuery]);
		return getResponse({
			url: `/mu_api?queries=${queriesRison}`,
		}).then(response =>
			expect(JSON.parse(response.payload)).toEqual({
				responses: MOCK_API_RESULT,
			})
		);
	});

	it('serves the app engine lifecycle route', () =>
		getResponse({ url: '/_ah/start' }).then(response =>
			expect(response.statusCode).toEqual(200)
		));
});
