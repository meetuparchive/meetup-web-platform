import url from 'url';
import Accepts from 'accepts';

export const LANG_DEFAULT = 'en-US';

export const getLanguage = (request, supportedLangs, defaultLang=LANG_DEFAULT) => {
	const firstPathComponent = request.url.path.split('/')[1];
	const urlLang = supportedLangs.includes(firstPathComponent) ? firstPathComponent : null;
	const browserLang = Accepts(request).language(supportedLangs);

	const langSourcePreference = [
		urlLang,
		browserLang,
		defaultLang,
	];

	// return the first language hit in the order of preference
	return langSourcePreference.find(lang => lang);
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
		const cleanOriginal = originalPath.replace(new RegExp(`/${supportedLangs.join('|')}/`), '');
		const newPathname = `/${requestLanguage}${cleanOriginal}`;
		return redirect(newPathname);
	}
	return null;
};

