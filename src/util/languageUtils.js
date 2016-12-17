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

export const checkLanguageRedirect = (
	request,
	reply,
	requestLanguage,
	supportedLangs,
	defaultLang=LANG_DEFAULT
) => {
	const firstPathComponent = request.url.path.split('/')[1];
	if (requestLanguage === defaultLang) {
		if (requestLanguage === firstPathComponent) {
			request.log(['info'], `Redundant ${defaultLang} path prefix, redirecting`);
			const redirectUrl = request.url;
			redirectUrl.pathname = request.url.pathname
				.replace(`/${firstPathComponent}`, '');
			return reply.redirect(url.format(redirectUrl));
		}
	} else if (requestLanguage !== firstPathComponent) {
		// must redirect either by correcting the lang prefix or inserting it
		let pathname;
		if (supportedLangs.includes(firstPathComponent)) {
			request.log(
				['info'],
				`Incorrect lang prefix (expected: ${requestLanguage}, actual: ${firstPathComponent})`
			);
			pathname = request.url.pathname
				.replace(`/${firstPathComponent}`, `/${requestLanguage}`);
		} else {
			// no lang prefix - inject it
			pathname = request.url.pathname
				.replace(`/${firstPathComponent}`, `/${requestLanguage}/${firstPathComponent}`);
		}
		return reply.redirect(url.format({ ...request.url, pathname }));
	}
	return null;
};

