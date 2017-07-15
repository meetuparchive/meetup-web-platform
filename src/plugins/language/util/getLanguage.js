import querystring from 'qs';
import Accepts from 'accepts';

export const getCookieLang = request => {
	const { isProd, supportedLangs } = request.server.settings.app;
	const LANGUAGE_COOKIE = isProd ? 'MEETUP_LANGUAGE' : 'MEETUP_LANGUAGE_DEV';

	const cookie = request.state[LANGUAGE_COOKIE];
	if (!cookie) {
		return;
	}
	const { language, country } = querystring.parse(cookie);
	const cookieLang = country ? `${language}-${country}` : language;
	if (supportedLangs) {
		return supportedLangs.includes(cookieLang) && cookieLang;
	}
	return cookieLang;
};

export const getUrlLang = request => {
	const { supportedLangs } = request.server.settings.app;
	const urlLang = request.url.path.split('/')[1];
	return supportedLangs.includes(urlLang) && urlLang;
};

/**
 * @param {Object} request Hapi request from browser
 * @param {Array} supportedLangs a _sorted_ list of supported langs, with
 *   preferred languages first
 * @return {String|Boolean} language code
 */
export const getBrowserLang = request => {
	const { supportedLangs } = request.server.settings.app;
	return Accepts(request).language(supportedLangs);
};

export default request => () =>
	// return the first language hit in the order of preference
	getCookieLang(request) || getUrlLang(request) || getBrowserLang(request);
