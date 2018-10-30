// @flow

import querystring from 'qs';
import Accepts from 'accepts';

type ParseRequestLang = HapiRequest => ?string | false;

const getServerSettings = (request: HapiRequest) => request.server.settings.app;

/*
 * Get cookie-specified language using MEETUP_LANGUAGE cookie value
 */
export const getCookieLang: ParseRequestLang = (request: HapiRequest) => {
	const { api: { isProd }, supportedLangs } = getServerSettings(request);
	const LANGUAGE_COOKIE = isProd ? 'MEETUP_LANGUAGE' : 'MEETUP_LANGUAGE_DEV';

	const cookie = request.state[LANGUAGE_COOKIE];
	if (!cookie) {
		return;
	}
	const { language, country } = querystring.parse(cookie);
	const cookieLang = country ? `${language}-${country}` : language;
	return supportedLangs.includes(cookieLang) && cookieLang;
};

/*
 * get the URL-specified language - check for existing language path prefixes
 */
export const getUrlLang: ParseRequestLang = (request: HapiRequest) => {
	const { supportedLangs } = getServerSettings(request);
	const urlLang = request.url.path.split('/')[1];
	const validRequestLang = supportedLangs.includes(urlLang) && urlLang;

	// If request url language is invalid, look at referer for language code
	// This is for cases when the request url is the api proxy path ie `/mu_api/`
	if (!validRequestLang && request.headers['referer']) {
		const refererUrl = new URL(request.headers['referer']);
		const refererLang = refererUrl.pathname.split('/')[1];
		return supportedLangs.includes(refererLang) && refererLang;
	}
	return validRequestLang;
};

/*
 * Get browser-request language using accept-language header
 */
export const getBrowserLang: ParseRequestLang = (request: HapiRequest) => {
	const { supportedLangs } = getServerSettings(request);
	return Accepts(request).language(supportedLangs);
};

/*
 * Get the language code determined from properties of the request (cookie,
 * url, header)
 */
export default (request: HapiRequest) => (): string =>
	// return the first language hit in the order of preference
	getCookieLang(request) ||
	getUrlLang(request) ||
	getBrowserLang(request) ||
	getServerSettings(request).supportedLangs[0];
