import * as fetchUtils from '../util/fetchUtils';
import serverFetchQueries from './fetchQueries';
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
			trackActivity: jest.fn(),
			state: {},
			server: { settings: { app: { api: {} } } },
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
