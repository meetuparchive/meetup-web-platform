import rison from 'rison';

import {
	mockQuery,
	MOCK_AUTH_HEADER,
	MOCK_RENDERPROPS,
} from 'meetup-web-mocks/lib/app';
import { getServer } from 'mwp-test-utils';

import { parseRequestQueries } from './handler';

describe('parseRequestQueries', () => {
	const headers = { authorization: MOCK_AUTH_HEADER };
	const queries = [mockQuery(MOCK_RENDERPROPS)];
	it('extracts the queries provided in GET requests', () => {
		const data = { queries: rison.encode_array(queries) };
		const getRequest = {
			headers,
			method: 'get',
			query: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
			server: getServer(),
		};
		expect(
			parseRequestQueries(getRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('extracts the queries provided in POST requests', () => {
		const data = { queries: rison.encode_array(queries) };
		const postRequest = {
			headers,
			method: 'post',
			payload: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
			server: getServer(),
		};
		expect(
			parseRequestQueries(postRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('extracts the queries provided in PATCH requests', () => {
		const data = { queries: rison.encode_array(queries) };
		const patchRequest = {
			headers,
			method: 'patch',
			payload: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
			server: getServer(),
		};
		expect(
			parseRequestQueries(patchRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('throws an error for mal-formed queries', () => {
		const notAQuery = { foo: 'bar' };
		const data = { queries: rison.encode_array([notAQuery]) };
		const getRequest = {
			headers,
			method: 'get',
			query: data,
			state: {
				oauth_token: 'foo',
			},
			server: getServer(),
		};
		expect(() =>
			parseRequestQueries(getRequest, 'http://dummy.api.meetup.com')
		).toThrow();
	});
});
