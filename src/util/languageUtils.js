import url from 'url';
import Accepts from 'accepts';

export const LANG_DEFAULT = 'en-US';

const parseUrlLang = (pathname, supportedLangs) => {
	const urlLang = pathname.split('/')[1];  // first path component
	return supportedLangs.includes(urlLang) ? urlLang : null;
};

export const getLanguage = (request, supportedLangs, defaultLang=LANG_DEFAULT) => {
	const urlLang = parseUrlLang(request.path, supportedLangs, defaultLang);
	const browserLang = Accepts(request).language(supportedLangs);
	return urlLang || browserLang || defaultLang;
};

export const checkLanguageRedirect = (request, reply, requestLanguage, supportedLangs) => {
	const firstPathComponent = request.url.path.split('/')[1];
	if (requestLanguage === LANG_DEFAULT) {
		if (requestLanguage === firstPathComponent) {
			request.log(['info'], `Redundant ${LANG_DEFAULT} path prefix, redirecting`);
			const redirectUrl = request.url;
			redirectUrl.pathname = request.url.pathname
				.replace(`/${firstPathComponent}`, `/${requestLanguage}`);
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

