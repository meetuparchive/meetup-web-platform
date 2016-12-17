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
	it('returns supported language from URL pathname, if present', () => {
		const pathLang = 'asdf';
		const supportedLangs = ['asdf', 'sdfg'];
		const request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${pathLang}/`) };
		const lang = getLanguage(request, supportedLangs);
		expect(lang).toEqual(pathLang);
	});
	it('returns supported language from brower "Accept-Language" header, if present', () => {
	});
	it('returns default language, if present', () => {
	});
});
describe('checkLanguageRedirect', () => {
	it('calls redirect to root path when default lang requested', () => {
		spyOn(MOCK_HAPI_REPLY, 'redirect');
		const defaultLang = 'en-US';
		const requestLang = defaultLang;
		const supportedLangs = [defaultLang, 'sdfg'];
		let request, redirect;
		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${defaultLang}/`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).not.toBeNull();
		expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([rootUrl]);

		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${defaultLang}/foo`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).not.toBeNull();
		expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([`${rootUrl}foo`]);
	});
	it('calls redirect to requestLanguage path from incorrect language path', () => {
		spyOn(MOCK_HAPI_REPLY, 'redirect');
		const defaultLang = 'en-US';
		const requestLang = 'fr-FR';
		const supportedLangs = [defaultLang, requestLang];
		let request, redirect;
		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${defaultLang}/`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).not.toBeNull();
		expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([`${rootUrl}${requestLang}/`]);

		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${defaultLang}/foo`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).not.toBeNull();
		expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([`${rootUrl}${requestLang}/foo`]);
	});
	it('calls redirect to path with requestLanguage injected if missing', () => {
		spyOn(MOCK_HAPI_REPLY, 'redirect');
		const defaultLang = 'en-US';
		const requestLang = 'fr-FR';
		const supportedLangs = [defaultLang, requestLang];
		let request, redirect;
		request = { ...MOCK_HAPI_REQUEST, url: url.parse(rootUrl) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).not.toBeNull();
		expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([`${rootUrl}${requestLang}/`]);

		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}foo`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).not.toBeNull();
		expect(MOCK_HAPI_REPLY.redirect.calls.mostRecent().args).toEqual([`${rootUrl}${requestLang}/foo`]);
	});
	it('does not redirect if non-default language requested on correct language path', () => {
		spyOn(MOCK_HAPI_REPLY, 'redirect');
		const defaultLang = 'en-US';
		const requestLang = 'fr-FR';
		const supportedLangs = [defaultLang, requestLang];
		let request, redirect;
		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${requestLang}/`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).toBeNull();
		expect(MOCK_HAPI_REPLY.redirect).not.toHaveBeenCalled();

		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${requestLang}/foo`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).toBeNull();
		expect(MOCK_HAPI_REPLY.redirect).not.toHaveBeenCalled();
	});
	it('ignores unsupported language prefixes', () => {
		spyOn(MOCK_HAPI_REPLY, 'redirect');
		const defaultLang = 'en-US';
		const requestLang = 'abcd';
		const supportedLangs = [defaultLang];
		let request, redirect;
		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${requestLang}/`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).toBeNull();
		expect(MOCK_HAPI_REPLY.redirect).not.toHaveBeenCalled();

		request = { ...MOCK_HAPI_REQUEST, url: url.parse(`${rootUrl}${requestLang}/foo`) };
		redirect = checkLanguageRedirect(request, MOCK_HAPI_REPLY, requestLang, supportedLangs, defaultLang);
		expect(redirect).toBeNull();
		expect(MOCK_HAPI_REPLY.redirect).not.toHaveBeenCalled();
	});
});
