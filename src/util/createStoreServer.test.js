import * as fetchUtils from './fetchUtils';
import {
	testCreateStore
} from './testUtils';
import {
	getServerCreateStore,
	serverFetchQueries,
} from './createStoreServer';

jest.mock(
	'../apiProxy/api-proxy',
	() => jest.fn((request, queries) => {
		const { Observable } = require('rxjs/Observable');
		require('rxjs/add/observable/of');
		return Observable.of('response');
	})
);

const MOCK_ROUTES = {};
const MOCK_HAPI_REQUEST = {
	state: {}
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
		const request = {};
		const queries = [];
		const expectedParsedResponse = 'foo';
		spyOn(fetchUtils, 'parseQueryResponse').and.callFake(() => () => expectedParsedResponse);
		return serverFetchQueries(request)()(queries)
			.then(parsedResponse => {
				expect(require('../apiProxy/api-proxy')).toHaveBeenCalledWith(request, queries);
				expect(parsedResponse).toEqual(expectedParsedResponse);
			});
	});
});

