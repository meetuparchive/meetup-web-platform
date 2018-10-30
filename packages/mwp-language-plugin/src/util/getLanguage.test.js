import querystring from 'qs';
import url from 'url';
import getLanguage, {
	getCookieLang,
	getUrlLang,
	getBrowserLang,
} from './getLanguage';

const rootUrl = 'http://example.com/';
const LANGUAGE_COOKIE = 'MEETUP_LANGUAGE_DEV';
const defaultLang = 'en-US';
const similarToDefault = 'en-AU';
const altLang = 'fr-FR';
const altLang2 = 'de-DE';
const altLang3 = 'es-ES';
const unsupportedLang = 'xx-XX';
const supportedLangs = [
	defaultLang,
	similarToDefault,
	altLang,
	altLang2,
	altLang3,
];
const HEADERS = {
	'accept-language': unsupportedLang, // must test unsupported lang by default
	referer: '',
};
const MOCK_HAPI_REQUEST = {
	log() {},
	url: url.parse(rootUrl),
	headers: { ...HEADERS },
	state: {},
	server: { settings: { app: { supportedLangs, api: {} } } },
};
describe('getCookieLang', () => {
	it('returns undefined when no cookie in state', () => {
		const request = { ...MOCK_HAPI_REQUEST };
		const lang = getCookieLang(request, supportedLangs);
		expect(lang).toBeUndefined();
	});
	it('returns supported MEETUP_LANGUAGE cookie when present', () => {
		const MEETUP_LANGUAGE = querystring.stringify({
			country: 'FR',
			language: 'fr',
		});
		const request = {
			...MOCK_HAPI_REQUEST,
			state: { [LANGUAGE_COOKIE]: MEETUP_LANGUAGE },
		};
		const lang = getCookieLang(request);
		expect(lang).toEqual(altLang);
	});
});
describe('getUrlLang', () => {
	it('returns false for unsupported lang in url', () => {
		const requestLang = 'this-isnt-even-a-language';
		const request = {
			...MOCK_HAPI_REQUEST,
			url: url.parse(`${rootUrl}${requestLang}/`),
		};
		const lang = getUrlLang(request);
		expect(lang).toBe(false);
	});
	it('returns supported language from URL pathname, if present', () => {
		const requestLang = altLang;
		const request = {
			...MOCK_HAPI_REQUEST,
			url: url.parse(`${rootUrl}${requestLang}/`),
		};
		const lang = getUrlLang(request);
		expect(lang).toEqual(requestLang);
	});
	it('returns false for unsupported lang in both referer url and request url', () => {
		const requestLang = 'this-isnt-even-a-language';
		const request = {
			...MOCK_HAPI_REQUEST,
			url: url.parse(`${rootUrl}${requestLang}/`),
			headers: {
				...HEADERS,
				referer: `${rootUrl}${requestLang}/`,
			},
		};
		const lang = getUrlLang(request);
		expect(lang).toBe(false);
	});
	it('returns supported language from referer URL pathname, if present and a valid lang was not in request url', () => {
		const requestLang = altLang;
		const request = {
			...MOCK_HAPI_REQUEST,
			url: url.parse(`${rootUrl}${unsupportedLang}/`),
			headers: {
				...HEADERS,
				referer: `${rootUrl}${requestLang}/`,
			},
		};
		const lang = getUrlLang(request);
		expect(lang).toEqual(requestLang);
	});
});
describe('getBrowserLang', () => {
	it('returns false for unsupported browser language', () => {
		const acceptLang = 'this-isnt-even-a-language';
		const request = {
			...MOCK_HAPI_REQUEST,
			headers: { 'accept-language': acceptLang },
		};
		const lang = getBrowserLang(request);
		expect(lang).toBe(false);
	});
	it('returns en-US instead of en-AU for "en" if en-US is preferred', () => {
		const acceptLang = 'en';
		const request = {
			...MOCK_HAPI_REQUEST,
			headers: { 'accept-language': acceptLang },
		};
		const lang = getBrowserLang(request);
		expect(lang).toEqual('en-US');
	});
	it('returns supported language from brower "Accept-Language" header, if present', () => {
		const acceptLang = altLang;
		const request = {
			...MOCK_HAPI_REQUEST,
			headers: { 'accept-language': acceptLang },
		};
		const lang = getBrowserLang(request);
		expect(lang).toEqual(acceptLang);
	});
});
describe('getLanguage', () => {
	it('returns default language if no supported lang or URL pathname prefix', () => {
		const lang = getLanguage(MOCK_HAPI_REQUEST)();
		expect(lang).toEqual(defaultLang);
	});
});
