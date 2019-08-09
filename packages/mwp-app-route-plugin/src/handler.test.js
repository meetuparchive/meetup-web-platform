import handler from './handler';

const MOCK_HAPI_REQUEST = {
	url: new URL('https://example.com/bar?a=b'),
	getLangPrefixPath: () => '/foo',
};

const MOCK_HAPI_TOOLKIT = {
	redirect: jest.fn(),
};

describe('Language Prefix Redirect', () => {
	it('redirects to correct language path with original query string', () => {
		handler({})(MOCK_HAPI_REQUEST, MOCK_HAPI_TOOLKIT);
		expect(MOCK_HAPI_TOOLKIT.redirect.mock.calls[0][0]).toMatchInlineSnapshot(
			`"/foo?a=b"`
		);
	});
});
