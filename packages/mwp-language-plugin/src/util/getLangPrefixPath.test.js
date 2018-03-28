import url from 'url';
import getLangPrefixPath from './getLangPrefixPath';

const rootPath = '/';
const rootUrl = 'http://example.com/';
const defaultLang = 'en-US';
const similarToDefault = 'en-AU';
const altLang = 'fr-FR';
const altLang2 = 'de-DE';
const altLang3 = 'es-ES';
const supportedLangs = [defaultLang, similarToDefault, altLang, altLang2, altLang3];

const getMockRequest = override => {
	const request = {};
	return Object.assign(
		request,
		{
			log() {},
			url: url.parse(rootUrl),
			headers: {},
			requestLang: 'en-US',
			state: {},
			server: { settings: { app: { supportedLangs } } },
			getLanguage: () => request.requestLang,
			getLangPrefixPath: (...args) => getLangPrefixPath(request)(...args),
		},
		override
	);
};

describe('redirect', () => {
	function getRedirect({ requestLang, requestUrl }) {
		const request = getMockRequest({
			url: url.parse(requestUrl),
			requestLang,
		});
		return request.getLangPrefixPath();
	}
	function expectRedirect(options) {
		const actualRedirect = getRedirect(options);
		if (options.expectedRedirect) {
			expect(actualRedirect).not.toBeNull();
			expect(actualRedirect).toEqual(options.expectedRedirect);
		} else {
			expect(actualRedirect).toBeNull();
		}
	}
	function testRedirect(options) {
		expectRedirect(options);

		options.requestUrl = `${options.requestUrl}foo`;
		options.expectedRedirect =
			options.expectedRedirect && `${options.expectedRedirect}foo`;
		expectRedirect(options);
	}
	it('calls redirect to root path when default lang requested', () =>
		testRedirect({
			requestLang: defaultLang,
			requestUrl: `${rootUrl}${defaultLang}/`,
			expectedRedirect: rootPath,
		}));
	it('calls redirect to root path when default lang requested on incorrect language path', () =>
		testRedirect({
			requestLang: defaultLang,
			requestUrl: `${rootUrl}${altLang}/`,
			expectedRedirect: rootPath,
		}));
	it('calls redirect to requestLanguage path from incorrect language path', () => {
		const requestLang = altLang;
		supportedLangs.filter(l => l !== altLang).forEach(lang =>
			testRedirect({
				requestLang,
				requestUrl: `${rootUrl}${lang}/`,
				expectedRedirect: `${rootPath}${requestLang}/`,
			})
		);
	});
	it('calls redirect to path with requestLanguage injected if missing', () => {
		const requestLang = altLang;
		testRedirect({
			requestLang,
			requestUrl: rootUrl,
			expectedRedirect: `${rootPath}${requestLang}/`,
		});
	});
	it('does not redirect if non-default language requested on correct language path', () => {
		const requestLang = altLang;
		testRedirect({
			requestLang,
			requestUrl: `${rootUrl}${requestLang}/`,
			expectedRedirect: `${rootPath}${requestLang}/`,
		});
	});
	it('ignores unsupported language prefixes', () => {
		const requestLang = 'asdfasdf';
		testRedirect({
			requestLang,
			requestUrl: `${rootUrl}${requestLang}/`,
			expectedRedirect: `${rootPath}${requestLang}/`,
		});
	});
});
describe('redirect', () => {});
