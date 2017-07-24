import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import rison from 'rison';
import { MOCK_API_RESULT } from 'meetup-web-mocks/lib/app';

import getRoutes from './routes';
import { getServer } from './util/testUtils';

describe('routes', () => {
	it('serves the api route', () => {
		const validQuery = { type: 'a', ref: 'b', params: {} };
		const queriesRison = rison.encode_array([validQuery]);
		const MOCK_API_PROXY$ = () => Observable.of(MOCK_API_RESULT);
		// a Promise that returns the server instance after it has been
		// configured with the routes being tested
		const routes = getRoutes(MOCK_API_PROXY$);
		const server = getServer();
		server.route(routes);
		return server
			.inject({
				url: `/mu_api?queries=${queriesRison}`,
			})
			.then(response =>
				expect(JSON.parse(response.payload)).toEqual({
					responses: MOCK_API_RESULT,
				})
			);
	});
});
