import querystring from 'qs';
import url from 'url';
import Accepts from 'accepts';

export const LANG_DEFAULT = 'en-US';

export const getCookieLang = (request, supportedLangs) => {
	const cookie = request.state.MEETUP_LANGUAGE;
	if (!cookie) {
		return;
	}
	const {
		language,
		country,
	} = querystring.parse(cookie);
	const cookieLang = `${language}-${country}`;
	return supportedLangs.includes(cookieLang) && cookieLang;
};

export const getUrlLang = (request, supportedLangs) => {
	const urlLang = request.url.path.split('/')[1];
	return supportedLangs.includes(urlLang) && urlLang;
};

export const getBrowserLang = (request, supportedLangs) => {
	return Accepts(request).language(supportedLangs);
};

export const getLanguage = (request, supportedLangs, defaultLang=LANG_DEFAULT) => {
	// return the first language hit in the order of preference
	supportedLangs = supportedLangs.sort(l => l !== defaultLang);
	return getCookieLang(request, supportedLangs)
		|| getUrlLang(request, supportedLangs)
		|| getBrowserLang(request, supportedLangs)
		|| defaultLang;
};

const makeRedirect = (reply, originalUrl) => redirectPathname =>
	reply.redirect(url.format({ ...originalUrl, pathname: redirectPathname }));

export const checkLanguageRedirect = (
	request,
	reply,
	requestLanguage,
	supportedLangs,
	defaultLang=LANG_DEFAULT
) => {
	// ensure defaultLang is first in supportedLangs
	supportedLangs = supportedLangs.sort(l => l !== defaultLang);
	const originalPath = request.url.pathname;
	const firstPathComponent = originalPath.split('/')[1];
	const redirect = makeRedirect(reply, request.url);
	if (requestLanguage === defaultLang) {
		if (requestLanguage === firstPathComponent) {
			request.log(['info'], `Redundant ${defaultLang} path prefix, redirecting`);
			return redirect(originalPath.replace(`/${firstPathComponent}`, ''));
		}
	} else if (requestLanguage !== firstPathComponent) {
		// must redirect either by correcting the lang prefix or inserting it
		const cleanOriginal = originalPath.replace(new RegExp(`^/(${supportedLangs.join('|')})/`), '/');
		const newPathname = `/${requestLanguage}${cleanOriginal}`;
		return redirect(newPathname);
	}
	return null;
};

