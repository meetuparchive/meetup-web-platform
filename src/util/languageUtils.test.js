import url from 'url';
import {
	getLanguage,
	checkLanguageRedirect,
} from './languageUtils';

const rootUrl = 'http://example.com/';
const MOCK_HAPI_REQUEST = {
	log() {},
	url: url.parse(rootUrl),
	headers: {}
};
const MOCK_HAPI_REPLY = {
	redirect() {},
};

describe('getLanguage', () => {
	const defaultLang = 'en-US';
	const altLang = 'fr-FR';
	const supportedLangs = [defaultLang, altLang];
	it('returns supported language from URL pathname, if present', () => {
		const requestLang = altLang;
		const request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${requestLang}/`) };
		const lang = getLanguage(request, supportedLangs);
		expect(lang).toEqual(requestLang);
	});
	it('returns supported language from brower "Accept-Language" header, if present', () => {
		const acceptLang = altLang;
		const request = { ...MOCK_HAPI_REQUEST, headers: { 'accept-language': acceptLang } };
		const lang = getLanguage(request, supportedLangs);
		expect(lang).toEqual(acceptLang);
	});
	it('returns default language if no supported lang or URL pathname prefix', () => {
		const lang = getLanguage(MOCK_HAPI_REQUEST, supportedLangs, defaultLang);
		expect(lang).toEqual(defaultLang);
	});
});
describe('checkLanguageRedirect', () => {
	const defaultLang = 'en-US';
	const altLang = 'fr-FR';
	const supportedLangs = [defaultLang, altLang];
	function getRedirect({ requestLang, requestUrl }) {
		const request = { ...MOCK_HAPI_REQUEST, url: url.parse(requestUrl) };
		return checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
	}
	function expectRedirect(options) {
		if (options.expectedRedirect) {
			expect(getRedirect(options)).not.toBeNull();
			expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([options.expectedRedirect]);
		} else {
			expect(getRedirect(options)).toBeNull();
			expect(MOCK_HAPI_REPLY.redirect).not.toHaveBeenCalled();
		}
	}
	function testRedirect(options) {
		spyOn(MOCK_HAPI_REPLY, 'redirect');
		expectRedirect(options);

		options.requestUrl = `${options.requestUrl}foo`;
		options.expectedRedirect = options.expectedRedirect && `${options.expectedRedirect}foo`;
		expectRedirect(options);
	}

	it('calls redirect to root path when default lang requested', () =>
		testRedirect({
			requestLang: defaultLang,
			requestUrl: `${rootUrl}${defaultLang}/`,
			expectedRedirect: rootUrl,
		})
	);
	it('calls redirect to requestLanguage path from incorrect language path', () => {
		const requestLang = altLang;
		testRedirect({
			requestLang,
			requestUrl: `${rootUrl}${defaultLang}/`,
			expectedRedirect: `${rootUrl}${requestLang}/`
		});
	});
	it('calls redirect to path with requestLanguage injected if missing', () => {
		const requestLang = altLang;
		testRedirect({
			requestLang,
			requestUrl: rootUrl,
			expectedRedirect: `${rootUrl}${requestLang}/`,
		});
	});
	it('does not redirect if non-default language requested on correct language path', () => {
		const requestLang = altLang;
		testRedirect({
			requestLang,
			requestUrl: `${rootUrl}${requestLang}/`,
			expectedRedirect: false,
		});
	});
	it('ignores unsupported language prefixes', () => {
		const requestLang = 'asdfasdf';
		testRedirect({
			requestLang,
			requestUrl: `${rootUrl}${requestLang}/`,
			expectedRedirect: false,
		});
	});
});
