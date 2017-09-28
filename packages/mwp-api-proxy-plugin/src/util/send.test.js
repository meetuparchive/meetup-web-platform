import fs from 'fs';
import { getServer } from 'mwp-test-utils';

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
	getExternalRequestOpts,
	getLanguageHeader,
	getClientIpHeader,
	parseMultipart,
	API_META_HEADER,
} from './send';

import { API_PROXY_PLUGIN_NAME } from '../config';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));
jest.mock('mwp-cli/src/config', () => {
	const config = require.requireActual('mwp-cli/src/config');
	config.package = { agent: 'TEST_AGENT ' };
	return config;
});

const MOCK_HAPI_REQUEST = {
	server: getServer(),
	method: 'get',
	headers: {},
	query: {},
	state: {},
	plugins: {
		[API_PROXY_PLUGIN_NAME]: {
			uploads: [],
		},
		requestAuth: {},
	},
	getLanguage: () => 'en-US',
};

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

describe('getClientIpHeader', () => {
	it('returns a x-meetup-client-ip header when a fastly-client-ip header is set', () => {
		const clientIpHeader = {
			'X-Meetup-Client-Ip': '127.0.0.1',
		};
		const request = {
			headers: {
				'fastly-client-ip': '127.0.0.1',
			},
			query: {},
		};
		expect(getClientIpHeader(request)).toEqual(clientIpHeader);
	});
	it('returns a x-meetup-client-ip header when _set_geoip header is set', () => {
		const clientIpHeader = {
			'X-Meetup-Client-Ip': '127.0.0.2',
		};
		const request = {
			query: {
				_set_geoip: '127.0.0.2',
			},
			headers: {},
		};
		expect(getClientIpHeader(request)).toEqual(clientIpHeader);
	});

	it('Does not set the header if fastly-client-ip or query param is not set', () => {
		const request = {
			headers: {},
			query: {},
		};
		expect(getClientIpHeader(request)).toBeUndefined();
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
			param: {
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
			param: {
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
	it('Does not double-encode the URL', () => {
		const method = 'get';
		const decodedQuery = {
			endpoint: encodeURI('バ-京'), // 'pre-encode' the endpoint
			params: {},
		};
		const getArgs = buildRequestArgs({ ...options, method })(decodedQuery);
		const { pathname } = require('url').parse(getArgs.url);
		expect(pathname).toBe(`/${decodedQuery.endpoint}`); // eslint-disable-line no-control-regex
	});
});

describe('getExternalRequestOpts', () => {
	it('returns the expected object from a vanilla request', () => {
		expect(getExternalRequestOpts(MOCK_HAPI_REQUEST)).toMatchSnapshot();
	});
	it('returns the expected object from a multipart request', () => {
		// most important difference is that multipart has a 'formData' key
		expect(
			getExternalRequestOpts({
				...MOCK_HAPI_REQUEST,
				mime: 'multipart/form-data',
				payload: { foo: 'bar' },
			})
		).toMatchSnapshot();
	});
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

describe('parseMultipart', () => {
	it('passes through non-file data unchanged', () => {
		const payload = { foo: 'bar', baz: 1 };
		expect(parseMultipart(payload, [])).toEqual(payload);
	});
	it('converts a file descriptor to a readable stream', () => {
		// have to mock 'fs' here rather than globally b/c jest needs a clean 'fs' module to run
		const originalCRS = fs.createReadStream;
		const fakeCRS = path => ({ path });
		fs.createReadStream = jest.fn(fakeCRS);
		const payload = {
			foo: 'bar',
			myfile: {
				filename: 'baz.jpg',
				headers: { 'content-type': 'smileyface' },
				path: 'path/to/file.jpg',
			},
		};
		const expectedFile = {
			value: fakeCRS(payload.myfile.path),
			options: {
				filename: payload.myfile.filename,
				contentType: payload.myfile.headers['content-type'],
			},
		};
		const uploads = [];
		expect(parseMultipart(payload, uploads)).toEqual({
			...payload,
			myfile: expectedFile,
		});
		expect(uploads).toHaveLength(1);
		expect(uploads[0]).toEqual(payload.myfile.path);
		// restore original fs.createReadStream implementation
		fs.createReadStream = originalCRS;
	});
});
