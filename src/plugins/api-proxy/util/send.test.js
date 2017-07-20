import { getServer } from '../../../util/testUtils';

import 'rxjs/add/operator/toPromise';

import {
	mockQuery,
	MOCK_RENDERPROPS,
	MOCK_RENDERPROPS_UTF8,
} from 'meetup-web-mocks/lib/app';

import {
	createCookieJar,
	makeExternalApiRequest,
	buildRequestArgs,
	getAuthHeaders,
	getLanguageHeader,
	API_META_HEADER,
} from './send';

const MOCK_HAPI_REQUEST = { server: getServer() };

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

describe('getLanguageHeader', () => {
	it('returns accept-language containing request.getLanguage()', () => {
		const requestLang = 'fr-FR';
		const request = {
			headers: {},
			getLanguage: () => requestLang,
		};
		expect(getLanguageHeader(request)).toEqual(requestLang);
	});
	it('prepends parsed MEMBER_LANGUAGE cookie on existing accepts-langauge', () => {
		const headerLang = 'foo';
		const requestLang = 'fr-FR';
		const request = {
			headers: { 'accept-language': headerLang },
			getLanguage: () => requestLang,
		};
		expect(getLanguageHeader(request)).toEqual(`fr-FR,${headerLang}`);
	});
	it('returns existing accepts-langauge unmodified when no language cookie', () => {
		const headerLang = 'foo';
		const request = {
			headers: { 'accept-language': headerLang },
			getLanguage: () => {},
		};
		expect(getLanguageHeader(request)).toEqual(headerLang);
	});
});

describe('buildRequestArgs', () => {
	const testQueryResults = mockQuery(MOCK_RENDERPROPS);
	const url = 'http://example.com';
	const options = {
		url,
		headers: {
			authorization: 'Bearer testtoken',
		},
		mode: 'no-cors',
	};

	it('Converts an api config to arguments for a node-request call', () => {
		let method = 'get';
		const getArgs = buildRequestArgs({ ...options, method })(testQueryResults);
		method = 'post';
		const postArgs = buildRequestArgs({ ...options, method })(testQueryResults);
		expect(getArgs).toEqual(jasmine.any(Object));
		expect(getArgs.url).toMatch(/\?.+/); // get requests will add querystring
		expect(getArgs.hasOwnProperty('body')).toBe(false); // get requests will not have a body
		expect(postArgs.url).not.toMatch(/\?.+/); // post requests will not add querystring
		expect(postArgs.body).toEqual(jasmine.any(String)); // post requests will add body string
		// post requests will add body string
		expect(postArgs.headers['content-type']).toEqual(
			'application/x-www-form-urlencoded'
		);
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

	it('Sets X-Meetup-Variants header when query has flags', () => {
		const experiment = 'binge-pilot';
		const context = '1234';
		const query = {
			endpoint: 'foo',
			type: 'bar',
			params: {
				foo: 'bar',
			},
			meta: {
				variants: {
					[experiment]: context,
				},
			},
		};
		const getArgs = buildRequestArgs({ ...options, method: 'get' })(query);
		expect(getArgs.headers['X-Meetup-Variants']).toEqual(
			`${experiment}=${context}`
		);
		const postArgs = buildRequestArgs({ ...options, method: 'post' })(query);
		expect(postArgs.headers['X-Meetup-Variants']).toEqual(
			`${experiment}=${context}`
		);
	});

	it('adds api meta request header with expected value from array provided in query', () => {
		const query = {
			endpoint: 'foo',
			type: 'bar',
			meta: { metaRequestHeaders: ['foo', 'bar'] },
		};
		const requestArgs = buildRequestArgs({ ...options, method: 'get' })(query);
		const requestHeaders = Object.keys(requestArgs.headers);
		const expectedApiMetaHeader = 'foo,bar';

		expect(requestHeaders).toContain(API_META_HEADER);
		expect(requestArgs.headers[API_META_HEADER]).toBe(expectedApiMetaHeader);
	});

	const testQueryResults_utf8 = mockQuery(MOCK_RENDERPROPS_UTF8);

	it('Properly encodes the URL', () => {
		const method = 'get';
		const getArgs = buildRequestArgs({ ...options, method })(
			testQueryResults_utf8
		);
		const { pathname } = require('url').parse(getArgs.url);
		expect(/^[\x00-\xFF]*$/.test(pathname)).toBe(true); // eslint-disable-line no-control-regex
	});
});

describe('getExternalRequestOpts', () => {});
// Mock the request module with a an empty response delayed by 200ms
jest.mock('request', () => {
	const mock = jest.fn((requestOpts, cb) =>
		setTimeout(
			() =>
				cb(
					null,
					{
						headers: {},
						statusCode: 200,
						elapsedTime: 1234,
						request: {
							uri: {
								query: 'foo=bar',
								pathname: '/foo',
							},
							method: 'get',
						},
					},
					'{}'
				),
			2
		)
	);
	mock.jar = jest.fn(() => 'myMockJar');
	return mock;
});

describe('createCookieJar', () => {
	it('returns a cookie jar for /sessions endpoint', () => {
		const jar = createCookieJar('/sessions?asdfasd');
		expect(jar).not.toBeNull();
	});
	it('returns null for non-sessions endpoint', () => {
		const jar = createCookieJar('/not-sessions?asdfasd');
		expect(jar).toBeNull();
	});
});

describe('makeExternalApiRequest', () => {
	it('calls externalRequest with requestOpts', () => {
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest(MOCK_HAPI_REQUEST)(requestOpts)
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg).toBe(requestOpts));
	});
	it('throws an error when the API times out', () => {
		const API_TIMEOUT = 1;
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest({
			server: {
				settings: { app: { api: { timeout: API_TIMEOUT } } },
			},
		})(requestOpts)
			.toPromise()
			.then(
				() => expect(true).toBe(false), // should not be called
				err => expect(err).toEqual(jasmine.any(Error))
			);
	});
	it('returns the requestOpts jar at array index 2', () => {
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
			jar: 'fooJar',
		};
		return makeExternalApiRequest(MOCK_HAPI_REQUEST)(requestOpts)
			.toPromise()
			.then(([response, body, jar]) => expect(jar).toBe(requestOpts.jar));
	});
});
