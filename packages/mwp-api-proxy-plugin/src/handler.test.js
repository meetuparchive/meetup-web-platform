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
	it('extracts the queries provided in GET requests', async () => {
		const data = { queries: rison.encode_array(queries) };
		const server = await getServer();
		const getRequest = {
			headers,
			server,
			method: 'get',
			query: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
		};
		expect(
			parseRequestQueries(getRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('extracts the queries provided in POST requests', async () => {
		const data = { queries: rison.encode_array(queries) };
		const server = await getServer();
		const postRequest = {
			headers,
			server,
			method: 'post',
			payload: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
		};
		expect(
			parseRequestQueries(postRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('extracts the queries provided in PATCH requests', async () => {
		const data = { queries: rison.encode_array(queries) };
		const server = await getServer();
		const patchRequest = {
			headers,
			server,
			method: 'patch',
			payload: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
		};
		expect(
			parseRequestQueries(patchRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('extracts the queries provided in PUT requests', async () => {
		const data = { queries: rison.encode_array(queries) };
		const server = await getServer();
		const patchRequest = {
			headers,
			server,
			method: 'put',
			payload: data,
			state: {
				oauth_token: 'foo',
			},
			getLanguage: () => 'en-US',
		};
		expect(
			parseRequestQueries(patchRequest, 'http://dummy.api.meetup.com')
		).toEqual(queries);
	});
	it('throws an error for mal-formed queries', async () => {
		const notAQuery = { foo: 'bar' };
		const data = { queries: rison.encode_array([notAQuery]) };
		const server = await getServer();
		const getRequest = {
			headers,
			server,
			method: 'get',
			query: data,
			state: {
				oauth_token: 'foo',
			},
		};
		expect(() =>
			parseRequestQueries(getRequest, 'http://dummy.api.meetup.com')
		).toThrow();
	});
});
