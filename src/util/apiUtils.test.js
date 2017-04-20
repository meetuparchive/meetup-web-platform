import externalRequest from 'request';
import rison from 'rison';

import {
	mockQuery,
	MOCK_API_PROBLEM,
	MOCK_AUTH_HEADER,
	MOCK_RENDERPROPS,
	MOCK_RENDERPROPS_UTF8,
} from 'meetup-web-mocks/lib/app';

import {
	MOCK_DUOTONE_URLS,
	MOCK_GROUP,
	MOCK_MEMBER,
} from 'meetup-web-mocks/lib/api';

import { getServer, MOCK_LOGGER } from '../util/testUtils';
import * as authUtils from '../util/authUtils';

import {
	apiResponseToQueryResponse,
	apiResponseDuotoneSetter,
	buildRequestArgs,
	errorResponse$,
	getAuthHeaders,
	injectResponseCookies,
	logApiResponse,
	parseRequest,
	parseApiResponse,
	parseApiValue,
	parseLoginAuth,
	parseMetaHeaders,
	groupDuotoneSetter,
} from './apiUtils';

describe('errorResponse$', () => {
	it('returns the request url pathname as response.meta.endpoint', () => {
		const endpoint = '/pathname';
		return errorResponse$(`http://example.com${endpoint}`)(new Error())
			.toPromise()
			.then(response => expect(response.meta.endpoint).toEqual(endpoint));
	});
	it('returns the error message as the response.error', () => {
		const message = 'foo';
		return errorResponse$('http://example.com')(new Error(message))
			.toPromise()
			.then(response => expect(response.error).toEqual(message));
	});
});

describe('getAuthHeaders', () => {
	it('returns authorization header if no member cookie and oauth_token', () => {
		const oauth_token = 'foo';
		const authHeaders = getAuthHeaders({
			state: { oauth_token },
			plugins: { requestAuth: {} },
		});
		expect(authHeaders.authorization.startsWith('Bearer ')).toBe(true);
		expect(authHeaders.authorization.endsWith(oauth_token)).toBe(true);
	});
	it('sets MEETUP_CSRF', () => {
		const MEETUP_MEMBER = 'foo';
		const authHeaders = getAuthHeaders({
			state: { MEETUP_MEMBER },
			plugins: { requestAuth: {} },
		});
		const cookies = authHeaders.cookie.split('; ').reduce((cookies, pair) => {
			const [name, ...value] = pair.split('=');
			return {
				...cookies,
				[name]: value.join('='),
			};
		}, {});

		expect(cookies['MEETUP_CSRF']).not.toBeUndefined();
		expect(cookies['MEETUP_CSRF_DEV']).not.toBeUndefined();
		expect(authHeaders['csrf-token']).toEqual(cookies['MEETUP_CSRF']);
	});
});

describe('injectResponseCookies', () => {
	const request = {
		plugins: {
			requestAuth: {
				reply: {
					state() {}
				},
			},
		},
	};
	const responseObj = {
		request: {
			uri: {
				href: 'http://example.com',
			},
		},
	};
	const response = {
		toJSON() {
			return responseObj;
		},
	};

	it('does nothing without a cookie jar', () => {
		spyOn(response, 'toJSON');
		injectResponseCookies(request)([response, null, null]);
		expect(response.toJSON).not.toHaveBeenCalled();
	});
	it('sets the provided cookies on the reply state', () => {
		const mockJar = externalRequest.jar();
		spyOn(request.plugins.requestAuth.reply, 'state');

		// set up mock cookie jar with a dummy cookie for the response.request.uri
		const key = 'foo';
		const value = 'bar';
		mockJar.setCookie(`${key}=${value}`, responseObj.request.uri.href);

		injectResponseCookies(request)([response, null, mockJar]);
		expect(request.plugins.requestAuth.reply.state).toHaveBeenCalledWith(
			key,
			value,
			jasmine.any(Object)  // don't actually care about the cookie options
		);
	});
});

describe('parseApiValue', () => {
	const MOCK_RESPONSE = {
		headers: {},
		statusCode: 200
	};
	it('converts valid JSON into an equivalent object', () => {
		const validJSON = JSON.stringify(MOCK_GROUP);
		expect(parseApiValue([MOCK_RESPONSE, validJSON])).toEqual(jasmine.any(Object));
		expect(parseApiValue([MOCK_RESPONSE, validJSON])).toEqual({ value: MOCK_GROUP });
	});
	it('returns an object with a string "error" value for invalid JSON', () => {
		const invalidJSON = 'not valid';
		expect(parseApiValue([MOCK_RESPONSE, invalidJSON]).error).toEqual(jasmine.any(String));
	});
	it('returns an object with a string "error" value for API response with "problem"', () => {
		const responeWithProblem = JSON.stringify(MOCK_API_PROBLEM);
		expect(parseApiValue([MOCK_RESPONSE, responeWithProblem]).error).toEqual(jasmine.any(String));
	});
	it('returns an object with a string "error" value for a not-ok response', () => {
		const noContentStatus = {
			statusCode: 204,
			statusMessage: 'No Content',
		};
		const noContentResponse = { ...MOCK_RESPONSE, ...noContentStatus };
		expect(parseApiValue([noContentResponse, '']).value).toBeNull();
	});
	it('returns an object with a string "error" value for a not-ok response', () => {
		const badStatus = {
			statusCode: 500,
			statusMessage: 'Problems',
		};
		const nonOkReponse = { ...MOCK_RESPONSE, ...badStatus };
		expect(parseApiValue([nonOkReponse, '{}']).error).toEqual(badStatus.statusMessage);
	});
});
describe('parseApiResponse', () => {
	const MOCK_RESPONSE = {
		headers: {},
		statusCode: 200
	};
	it('returns the flags set in the X-Meetup-Flags header', () => {
		const headers = {
			'x-meetup-flags': 'foo=true,bar=false',
		};
		const flaggedResponse = { ...MOCK_RESPONSE, headers };
		expect(parseApiResponse('http://example.com')([flaggedResponse, '{}']).meta.flags).toEqual({
			foo: true,
			bar: false,
		});
	});
	it('returns the requestId set in the X-Meetup-Request-Id header', () => {
		const requestId = '1234';
		const headers = {
			'x-meetup-request-id': requestId,
		};
		const flaggedResponse = { ...MOCK_RESPONSE, headers };
		expect(parseApiResponse('http://example.com')([flaggedResponse, '{}']).meta.requestId).toEqual(requestId);
	});
});

describe('parseLoginAuth', () => {
	it('calls removeAuthState for login responses', () => {
		spyOn(authUtils, 'removeAuthState').and.returnValue(() => {});
		const request = { plugins: { requestAuth: {} } };
		const query = { type: 'login' };
		const loginResponse = { type: 'login', value: {} };
		parseLoginAuth(request, query)(loginResponse);
		expect(authUtils.removeAuthState).toHaveBeenCalled();
	});
	it('does not call removeAuthState for non-login responses', () => {
		spyOn(authUtils, 'removeAuthState').and.returnValue(() => {});
		const request = { plugins: { requestAuth: {} } };
		const query = { type: 'member' };
		const apiResponse = { type: 'member', value: {} };
		const returnVal = parseLoginAuth(request, query)(apiResponse);
		expect(authUtils.removeAuthState).not.toHaveBeenCalled();
		expect(returnVal).toBe(apiResponse);
	});
	it('does not call removeAuthState when request.plugins does not exist', () => {
		spyOn(authUtils, 'removeAuthState').and.returnValue(() => {});
		const request = { plugins: {} };
		const query = { type: 'login' };
		const loginResponse = { type: 'login', value: {} };
		const returnVal = parseLoginAuth(request, query)(loginResponse);
		expect(authUtils.removeAuthState).not.toHaveBeenCalled();
		expect(returnVal).toBe(loginResponse);
	});
	it('does not call removeAuthState when response has errors', () => {
		spyOn(authUtils, 'removeAuthState').and.returnValue(() => {});
		const request = { plugins: {} };
		const query = { type: 'login' };
		const loginResponse = { type: 'login', value: { error: true } };
		const returnVal = parseLoginAuth(request, query)(loginResponse);
		expect(authUtils.removeAuthState).not.toHaveBeenCalled();
		expect(returnVal).toBe(loginResponse);
	});
});

describe('parseMetaHeaders', () => {
	it('returns x-meetup-flags as flags object with real booleans camelcased', () => {
		expect(parseMetaHeaders({ 'x-meetup-foo-bar': 'whatwhat' }))
			.toMatchObject({ fooBar: 'whatwhat' });
	});
	it('returns x-meetup-flags as flags object with real booleans', () => {
		expect(parseMetaHeaders({ 'x-meetup-flags': 'foo=true,bar=false' }))
			.toMatchObject({ flags: { foo: true, bar: false } });
	});
	it('parses specified x- headers', () => {
		expect(parseMetaHeaders({ 'x-total-count': 'whatwhat' }))
			.toMatchObject({ totalCount: 'whatwhat' });
	});
	it('parses Link header', () => {
		const next = 'http://example.com/next';
		const prev = 'http://example.com/prev';

		// both 'next' and 'prev'
		expect(parseMetaHeaders({ link: `<${next}>; rel="next", <${prev}>; rel="prev"` }))
			.toMatchObject({ link: { next, prev } });
		// just 'next'
		expect(parseMetaHeaders({ link: `<${next}>; rel="next"` }))
			.toMatchObject({ link: { next } });
	});
	it('returns empty object for empty headers', () => {
		expect(parseMetaHeaders({}))
			.toEqual({});
	});
});

describe('buildRequestArgs', () => {
	const testQueryResults = mockQuery(MOCK_RENDERPROPS);
	const url = 'http://example.com';
	const options = {
		url,
		headers: {
			authorization: 'Bearer testtoken'
		},
		mode: 'no-cors'
	};

	it('Converts an api config to arguments for a node-request call', () => {
		let method = 'get';
		const getArgs = buildRequestArgs({ ...options, method })(testQueryResults);
		method = 'post';
		const postArgs = buildRequestArgs({ ...options, method })(testQueryResults);
		expect(getArgs).toEqual(jasmine.any(Object));
		expect(getArgs.url).toMatch(/\?.+/);  // get requests will add querystring
		expect(getArgs.hasOwnProperty('body')).toBe(false);  // get requests will not have a body
		expect(postArgs.url).not.toMatch(/\?.+/);  // post requests will not add querystring
		expect(postArgs.body).toEqual(jasmine.any(String));  // post requests will add body string
		// post requests will add body string
		expect(postArgs.headers['content-type']).toEqual('application/x-www-form-urlencoded');

	});

	it('Sets X-Meetup-Request-Flags header when query has flags', () => {
		const query = {
			endpoint: 'foo',
			type: 'bar',
			params: {
				foo: 'bar',
			},
			flags: ['asdf'],
		};
		const getArgs = buildRequestArgs({ ...options, method: 'get' })(query);
		expect(getArgs.headers['X-Meetup-Request-Flags']).not.toBeUndefined();
		const postArgs = buildRequestArgs({ ...options, method: 'post' })(query);
		expect(postArgs.headers['X-Meetup-Request-Flags']).not.toBeUndefined();
	});

	const testQueryResults_utf8 = mockQuery(MOCK_RENDERPROPS_UTF8);

	it('Properly encodes the URL', () => {
		const method = 'get';
		const getArgs = buildRequestArgs({ ...options, method })(testQueryResults_utf8);
		const { pathname } = require('url').parse(getArgs.url);
		expect(/^[\x00-\xFF]*$/.test(pathname)).toBe(true);  // eslint-disable-line no-control-regex
	});

});

describe('apiResponseToQueryResponse', () => {
	beforeEach(function() {
		this.refs = ['foo', 'bar'];
		this.queries = this.refs.map(ref => ({ ref }));
		// mock api response is just a map of refs to empty objects
		this.MOCK_API_RESPONSES = this.refs.map(ref => ({ ref }));
	});

	it('transforms an API response object to an object for State consumption', function() {
		this.MOCK_API_RESPONSES
			.map((apiResponse, i) => apiResponseToQueryResponse(this.queries[i])(apiResponse))
			.forEach((queryResponse, i)=> {
				expect(queryResponse).toEqual(jasmine.any(Object));
				expect(queryResponse.ref).toEqual(this.refs[i]);
			});
	});
});

describe('groupDuotoneSetter', () => {
	it('adds duotone url to group object', () => {
		const group = { ...MOCK_GROUP };
		const modifiedGroup = groupDuotoneSetter(MOCK_DUOTONE_URLS)(group);
		const { duotoneUrl } = modifiedGroup;
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
});

describe('apiResponseDuotoneSetter', () => {
	it('adds duotone url to type: "group" api response', () => {
		const group = { ...MOCK_GROUP };
		const { ref, type } = mockQuery({});
		expect(group.duotoneUrl).toBeUndefined();
		const groupApiResponse = {
			ref,
			type,
			value: group
		};
		const modifiedResponse = apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(groupApiResponse);
		const { duotoneUrl } = modifiedResponse.value;
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
	it('adds duotone url to type: "home" api response', () => {
		// this is an awkward test because we have to mock the deeply-nested
		// self/home endpoint and then look for a property deep inside it
		const group = { ...MOCK_GROUP };
		expect(group.duotoneUrl).toBeUndefined();
		const homeApiResponse = {
			ref: 'memberHome',
			type: 'home',
			value: {
				rows: [{
					items: [{
						type: 'group',
						group
					}],
				}]
			}
		};
		// run the function - rely on side effect in group
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(homeApiResponse);
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(group.duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
	it('returns object unmodified when it doesn\'t need duotones', () => {
		const member = { ...MOCK_MEMBER };
		const memberResponse = {
			ref: 'self',
			type: 'member',
			value: member,
		};
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(memberResponse);
		expect(member).toEqual(MOCK_MEMBER);
	});
	it('returns object unmodified when it contains errors', () => {
		const errorResponse = {
			self: {
				type: 'member',
				value: {
					error: new Error(),
				},
			}
		};
		const errorExpectedResponse = { ...errorResponse };
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(errorResponse);
		expect(errorResponse).toEqual(errorExpectedResponse);
	});
});

describe('logApiResponse', () => {
	const request = { server: getServer() };
	const MOCK_INCOMINGMESSAGE_GET = {
		elapsedTime: 1234,
		request: {
			uri: {
				query: 'foo=bar',
				pathname: '/foo',
			},
			method: 'get',
		},
	};
	const MOCK_INCOMINGMESSAGE_POST = {
		elapsedTime: 2345,
		request: {
			uri: {
				pathname: '/foo',
			},
			method: 'post'
		},
	};
	it('emits parsed request and response data for GET request', () => {
		MOCK_LOGGER.info.mockClear();
		logApiResponse(request)([MOCK_INCOMINGMESSAGE_GET, 'foo']);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject).toEqual(jasmine.any(Object));
	});
	it('emits parsed request and response data for POST request', () => {
		MOCK_LOGGER.info.mockClear();
		logApiResponse(request)([MOCK_INCOMINGMESSAGE_POST, 'foo']);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject).toEqual(jasmine.any(Object));
	});
	it('handles multiple querystring vals for GET request', () => {
		MOCK_LOGGER.info.mockClear();
		const response = {
			...MOCK_INCOMINGMESSAGE_GET,
			request: {
				...MOCK_INCOMINGMESSAGE_GET.request,
				uri: {
					query: 'foo=bar&baz=boodle',
					pathname: '/foo',
				},
			},
		};
		logApiResponse(request)([response, 'foo']);
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject.info.query).toEqual({
			foo: 'bar',
			baz: 'boodle',
		});
	});
	it('returns the full body of the response if less than 256 characters', () => {
		const body = 'foo';
		MOCK_LOGGER.info.mockClear();
		logApiResponse(request)([MOCK_INCOMINGMESSAGE_GET, body]);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject.info.body).toEqual(body);
	});
	it('returns a truncated response body if more than 256 characters', () => {
		const body300 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean egestas viverra sem vel congue. Cras vitae malesuada justo. Fusce ut finibus felis, at sagittis leo. Morbi nec velit dignissim, viverra tellus at, pretium nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla turpis duis.';
		MOCK_LOGGER.info.mockClear();
		logApiResponse(request)([MOCK_INCOMINGMESSAGE_GET, body300]);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject.info.body.startsWith(body300.substr(0, 256))).toBe(true);
		expect(loggedObject.info.body.startsWith(body300)).toBe(false);
	});
});

describe('parseRequest', () => {
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
			server: getServer({ API_SERVER_ROOT_URL: 'http://example.com' }),
		};
		expect(parseRequest(getRequest, 'http://dummy.api.meetup.com').queries).toEqual(queries);
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
			server: getServer({ API_SERVER_ROOT_URL: 'http://example.com' }),
		};
		expect(parseRequest(postRequest, 'http://dummy.api.meetup.com').queries).toEqual(queries);
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
			server: getServer({ API_SERVER_ROOT_URL: 'http://example.com' }),
		};
		expect(parseRequest(patchRequest, 'http://dummy.api.meetup.com').queries).toEqual(queries);
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
			server: getServer({ API_SERVER_ROOT_URL: 'http://example.com' }),
		};
		expect(() => parseRequest(getRequest, 'http://dummy.api.meetup.com')).toThrow();
	});
});

