import {
	mockQuery,
	MOCK_RENDERPROPS,
} from 'meetup-web-mocks/lib/app';

import * as authUtils from '../util/authUtils';

import {
	makeApiRequest$,
	parseLoginAuth,
} from './api-proxy';

describe('makeApiRequest$', () => {
	const endpoint = 'foo';
	it('makes a GET request', () => {

	});
	it('makes a POST request', () => {
	});
	it('responds with query.mockResponse when set', () => {
		const mockResponse = { foo: 'bar' };
		const query = { ...mockQuery(MOCK_RENDERPROPS), mockResponse };
		const expectedResponse = {
			[query.ref]: {
				meta: {
					flags: {},
					requestId: 'mock request',
					endpoint
				},
				type: query.type,
				value: mockResponse,
			}
		};
		return makeApiRequest$({ log: () => {} }, 5000, {})([{ url: endpoint }, query])
			.toPromise()
			.then(response => expect(response).toEqual(expectedResponse));
	});
});

describe('parseLoginAuth', () => {
	it('calls applyAuthState for login responses', () => {
		spyOn(authUtils, 'applyAuthState').and.returnValue(() => {});
		const request = { plugins: { requestAuth: {} } };
		const query = { type: 'login' };
		const loginResponse = { type: 'login', value: {} };
		parseLoginAuth(request, query)(loginResponse);
		expect(authUtils.applyAuthState).toHaveBeenCalled();
	});
	it('does not call applyAuthState for non-login responses', () => {
		spyOn(authUtils, 'applyAuthState').and.returnValue(() => {});
		const request = { plugins: { requestAuth: {} } };
		const query = { type: 'member' };
		const apiResponse = { type: 'member', value: {} };
		const returnVal = parseLoginAuth(request, query)(apiResponse);
		expect(authUtils.applyAuthState).not.toHaveBeenCalled();
		expect(returnVal).toBe(apiResponse);
	});
	it('does not call applyAuthState when request.plugins does not exist', () => {
		spyOn(authUtils, 'applyAuthState').and.returnValue(() => {});
		const request = { plugins: {} };
		const query = { type: 'login' };
		const loginResponse = { type: 'login', value: {} };
		const returnVal = parseLoginAuth(request, query)(loginResponse);
		expect(authUtils.applyAuthState).not.toHaveBeenCalled();
		expect(returnVal).toBe(loginResponse);
	});
});

