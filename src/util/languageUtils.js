import querystring from 'qs';
import url from 'url';
import Accepts from 'accepts';

import { LANGUAGE_COOKIE } from './cookieUtils';

export const getCookieLang = (request, supportedLangs) => {
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

export const getUrlLang = (request, supportedLangs) => {
	const urlLang = request.url.path.split('/')[1];
	return supportedLangs.includes(urlLang) && urlLang;
};

/**
 * @param {Object} request Hapi request from browser
 * @param {Array} supportedLangs a _sorted_ list of supported langs, with
 *   preferred languages first
 * @return {String|Boolean} language code
 */
export const getBrowserLang = (request, supportedLangs) =>
	Accepts(request).language(supportedLangs);

export const getLanguage = (request, supportedLangs) => {
	// return the first language hit in the order of preference
	return (
		getCookieLang(request, supportedLangs) ||
		getUrlLang(request, supportedLangs) ||
		getBrowserLang(request, supportedLangs) ||
		supportedLangs[0]
	);
};

const makeRedirect = (reply, originalUrl) => redirectPathname =>
	reply.redirect(url.format({ ...originalUrl, pathname: redirectPathname }));

export const checkLanguageRedirect = (
	request,
	reply,
	requestLanguage,
	supportedLangs
) => {
	const originalPath = request.url.pathname;
	const firstPathComponent = originalPath.split('/')[1];
	const redirect = makeRedirect(reply, request.url);
	// first listed locale is default
	if (requestLanguage === supportedLangs[0]) {
		// ensure that we are serving from un-prefixed URL
		if (supportedLangs.includes(firstPathComponent)) {
			request.log(
				['info'],
				`Incorrect lang path prefix (${firstPathComponent}), redirecting`
			);
			return redirect(originalPath.replace(`/${firstPathComponent}`, ''));
		}
	} else if (requestLanguage !== firstPathComponent) {
		// must redirect either by correcting the lang prefix or inserting it
		const cleanOriginal = originalPath.replace(
			new RegExp(`^/(${supportedLangs.join('|')})/`),
			'/'
		);
		const newPathname = `/${requestLanguage}${cleanOriginal}`;
		return redirect(newPathname);
	}
	return null;
};
