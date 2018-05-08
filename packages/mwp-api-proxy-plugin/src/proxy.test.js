import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { getServer } from 'mwp-test-utils';
import { mockQuery, MOCK_RENDERPROPS } from 'meetup-web-mocks/lib/app';

import * as send from './util/send';
import * as receive from './util/receive';

import apiProxy$ from './proxy';

jest.mock('mwp-config', () => {
	const config = require.requireActual('mwp-config');
	config.package = { agent: 'TEST_AGENT ' };
	return config;
});

const MOCK_HAPI_REQUEST = {
	auth: {
		credentials: { memberCookie: 'foo member', csrfToken: 'bar token' },
	},
	headers: {},
	query: {},
	method: 'get',
	state: {
		oauth_token: 'foo',
	},
	server: getServer(),
	log: () => {},
	trackActivity: () => {},
	getLanguage: () => 'en-US',
};

describe('apiProxy$', () => {
	const queries = [mockQuery(MOCK_RENDERPROPS), mockQuery(MOCK_RENDERPROPS)];
	it('returns an observable that emits an array of results', () => {
		const requestResult = {
			type: 'fake',
			value: { foo: 'bar' },
		};

		spyOn(send, 'makeSend$').and.returnValue(() => Observable.of(1));
		spyOn(receive, 'makeReceive').and.returnValue(query => response =>
			requestResult
		);
		const expectedResults = [requestResult, requestResult];
		return apiProxy$(MOCK_HAPI_REQUEST)(queries)
			.toPromise()
			.then(results => expect(results).toEqual(expectedResults));
	});

	const endpoint = 'foo';
	it('makes a GET request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return apiProxy$({ ...MOCK_HAPI_REQUEST, method: 'get' })([query])
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('get'));
	});
	it('makes a POST request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS), meta: { method: 'post' } };
		return apiProxy$({ ...MOCK_HAPI_REQUEST, method: 'post' })([query])
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('post'));
	});
	it('responds with query.mockResponse when set', () => {
		const mockResponse = { foo: 'bar' };
		const query = { ...mockQuery(MOCK_RENDERPROPS), mockResponse };
		const expectedResponses = [
			{
				ref: query.ref,
				meta: {
					requestId: 'mock-request',
					endpoint,
					statusCode: 200,
				},
				type: query.type,
				value: mockResponse,
				error: undefined,
			},
		];
		return apiProxy$({ ...MOCK_HAPI_REQUEST, method: 'get' })([query])
			.toPromise()
			.then(responses => expect(responses).toEqual(expectedResponses));
	});
});
