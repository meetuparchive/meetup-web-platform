import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import rison from 'rison';
import { getServer } from '../util/testUtils';
import * as apiUtils from '../util/apiUtils';
import { mockQuery, MOCK_RENDERPROPS } from 'meetup-web-mocks/lib/app';
import apiProxy$ from './api-proxy';

describe('apiProxy$', () => {
	const queries = [mockQuery(MOCK_RENDERPROPS), mockQuery(MOCK_RENDERPROPS)];
	it('returns an observable that emits an array of results', () => {
		const data = { queries: rison.encode_array(queries) };
		const getRequest = {
			headers: {},
			method: 'get',
			query: data,
			state: {
				oauth_token: 'foo',
			},
			server: getServer(),
			log: () => {},
			trackApi: () => {},
			getLanguage: () => 'en-US',
		};
		const requestResult = {
			type: 'fake',
			value: { foo: 'bar' },
		};
		spyOn(apiUtils, 'makeApiRequest$').and.returnValue(() =>
			Observable.of(requestResult)
		);
		const expectedResults = [requestResult, requestResult];
		return apiProxy$(getRequest)
			.toPromise()
			.then(results => expect(results).toEqual(expectedResults));
	});
});
