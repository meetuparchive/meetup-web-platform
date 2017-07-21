import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { getServer } from '../../util/testUtils';
import * as apiUtils from './util';
import { mockQuery, MOCK_RENDERPROPS } from 'meetup-web-mocks/lib/app';
import apiProxy$ from './proxy';

describe('apiProxy$', () => {
	const queries = [mockQuery(MOCK_RENDERPROPS), mockQuery(MOCK_RENDERPROPS)];
	it('returns an observable that emits an array of results', () => {
		const getRequest = {
			headers: {},
			method: 'get',
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
		return apiProxy$(getRequest)(queries)
			.toPromise()
			.then(results => expect(results).toEqual(expectedResults));
	});
});
