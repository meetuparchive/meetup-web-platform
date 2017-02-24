import querystring from 'qs';
import Rx from 'rxjs';
import {
	MOCK_API_RESULT,
	MOCK_renderRequestMap,
	MOCK_RENDER_RESULT,
} from 'meetup-web-mocks/lib/app';

import getRoutes from './routes';
import { getServer } from './util/testUtils';

function getResponse(injectRequest, server=getServer()) {
	const MOCK_API_PROXY$ = () => Rx.Observable.of(MOCK_API_RESULT);
	// a Promise that returns the server instance after it has been
	// configured with the routes being tested
	const routes = getRoutes(
		MOCK_renderRequestMap,
		MOCK_API_PROXY$
	);
	server.route(routes);
	return server.inject(injectRequest);
}

describe('routes', () => {
	it('serves the homepage route', () =>
		getResponse({ url: '/' })
			.then(response => expect(response.payload).toEqual(MOCK_RENDER_RESULT))
	);
	it('serves the api route', () => {
		const validQuery = { type: 'a', ref: 'b', params: {} };
		const qs = querystring.stringify({ queries: JSON.stringify([validQuery]) });
		return getResponse({ url: `/mu_api?${qs}` })
			.then(response => expect(JSON.parse(response.payload)).toEqual({
				responses: MOCK_API_RESULT
			}));
	});
});

