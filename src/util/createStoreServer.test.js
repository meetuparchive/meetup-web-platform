import * as fetchUtils from './fetchUtils';
import { testCreateStore } from './testUtils';
import { getServerCreateStore, serverFetchQueries } from './createStoreServer';

const MOCK_ROUTES = {};
const MOCK_HAPI_REQUEST = {
	state: {},
	server: { app: { logger: { error: jest.fn() } } },
};

describe('getServerCreateStore', () => {
	testCreateStore(getServerCreateStore(MOCK_ROUTES, [], MOCK_HAPI_REQUEST));
});

describe('serverFetchQueries', () => {
	// export const serverFetchQueries = request => () => queries =>
	// 	apiProxy$(request, queries)
	// 	.toPromise()
	// 	.then(parseQueryResponse(queries));
	it('calls apiProxy$ with request and queries, passes ', () => {
		const request = {
			proxyApi$: jest.fn(() => {
				const { Observable } = require('rxjs/Observable');
				require('rxjs/add/observable/of');
				return Observable.of('response');
			}),
			trackApi: jest.fn(),
		};
		const queries = [];
		const expectedParsedResponse = 'foo';
		spyOn(fetchUtils, 'parseQueryResponse').and.callFake(() => () =>
			expectedParsedResponse
		);
		return serverFetchQueries(request)()(queries).then(parsedResponse => {
			expect(request.proxyApi$).toHaveBeenCalledWith(queries);
			expect(parsedResponse).toEqual(expectedParsedResponse);
		});
	});
});
