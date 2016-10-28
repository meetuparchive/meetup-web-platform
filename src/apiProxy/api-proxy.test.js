import {
	mockQueryBadType,
	mockQuery,
	MOCK_API_PROBLEM,
	MOCK_AUTH_HEADER,
	MOCK_RENDERPROPS,
} from '../util/mocks/app';
import {
	MOCK_DUOTONE_URLS,
	MOCK_GROUP,
} from '../util/mocks/api';
import {
	parseRequest,
	parseApiResponse,
	queryToApiConfig,
	buildRequestArgs,
	apiResponseToQueryResponse,
	apiResponseDuotoneSetter,
	groupDuotoneSetter,
} from './api-proxy';

describe('parseRequest', () => {
	it('extracts the queries provided in GET and POST requests', () => {
		const headers = { authorization: MOCK_AUTH_HEADER };
		const queries = [mockQuery(MOCK_RENDERPROPS)];
		const data = { queries: JSON.stringify(queries) };
		const getRequest = {
			headers,
			method: 'get',
			query: data,
		};
		const postRequest = {
			headers,
			method: 'post',
			payload: data,
		};

		expect(parseRequest(getRequest, 'http://dummy.api.meetup.com').queries).toEqual(queries);
		expect(parseRequest(postRequest, 'http://dummy.api.meetup.com').queries).toEqual(queries);
	});
});

describe('parseApiResponse', () => {
	it('converts valid JSON into an equivalent object', () => {
		const validJSON = JSON.stringify(MOCK_GROUP);
		expect(parseApiResponse(validJSON)).toEqual(jasmine.any(Object));
		expect(parseApiResponse(validJSON)).toEqual(MOCK_GROUP);
	});
	it('returns an object with a string "error" value for invalid JSON', () => {
		const invalidJSON = 'not valid';
		expect(parseApiResponse(invalidJSON).error).toEqual(jasmine.any(String));
	});
	it('returns an object with a string "error" value for API response with "problem"', () => {
		const responeWithProblem = JSON.stringify(MOCK_API_PROBLEM);
		expect(parseApiResponse(responeWithProblem).error).toEqual(jasmine.any(String));
	});
});

describe('queryToApiConfig', () => {
	it('transforms a query of known type to an object for API consumption', () => {
		const testQueryResults = mockQuery(MOCK_RENDERPROPS);
		expect(queryToApiConfig(testQueryResults)).toEqual(jasmine.any(Object));
		expect(queryToApiConfig(testQueryResults).endpoint).toEqual(jasmine.any(String));
	});

	it('throws a reference error when no API handler available for query type', () => {
		const testBadQueryResults = mockQueryBadType(MOCK_RENDERPROPS);
		expect(() => queryToApiConfig(testBadQueryResults)).toThrow(jasmine.any(ReferenceError));
	});
});

describe('buildRequestArgs', () => {
	const testQueryResults = mockQuery(MOCK_RENDERPROPS);
	const apiConfig = queryToApiConfig(testQueryResults);
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
		const getArgs = buildRequestArgs({ ...options, method })(apiConfig);
		method = 'post';
		const postArgs = buildRequestArgs({ ...options, method })(apiConfig);
		expect(getArgs).toEqual(jasmine.any(Object));
		expect(getArgs.url).toMatch(/\?.+/);  // get requests will add querystring
		expect(getArgs.hasOwnProperty('body')).toBe(false);  // get requests will not have a body
		expect(postArgs.url).not.toMatch(/\?.+/);  // post requests will not add querystring
		expect(postArgs.body).toEqual(jasmine.any(String));  // post requests will add body string
		// post requests will add body string
		expect(postArgs.headers['content-type']).toEqual('application/x-www-form-urlencoded');
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
				expect(queryResponse[this.refs[i]]).toEqual(jasmine.any(Object));
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
			[ref]: {
				type,
				value: group
			}
		};
		const modifiedResponse = apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(groupApiResponse);
		const { duotoneUrl } = modifiedResponse[ref].value;
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
	it('adds duotone url to type: "home" api response', () => {
		// this is an awkward test because we have to mock the deeply-nested
		// self/home endpoint and then look for a property deep inside it
		const group = { ...MOCK_GROUP };
		expect(group.duotoneUrl).toBeUndefined();
		const homeApiResponse = {
			memberHome: {
				type: 'home',
				value: {
					rows: [{
						items: [{
							type: 'group',
							group
						}],
					}]
				}
			}
		};
		// run the function - rely on side effect in group
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(homeApiResponse);
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(group.duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
});

