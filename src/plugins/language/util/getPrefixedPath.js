// @flow

/*
 * create a function that, when called, will determine the desired
 * language-prefixed path for the request. This can be used to redirect the
 * request to the 'correct' URL.
 * 
 * If the current request.url.pathname is correct, it will be returned
 * unmodified
 */
export default (request: HapiRequest) => (): string => {
	const { supportedLangs } = request.server.settings.app;
	const requestLanguage = request.getLanguage();
	const originalPath = request.url.pathname;
	const firstPathComponent = originalPath.split('/')[1];
	// first listed locale is default
	if (requestLanguage === supportedLangs[0]) {
		// ensure that we are serving from un-prefixed URL
		if (supportedLangs.includes(firstPathComponent)) {
			request.log(
				['info'],
				`Incorrect lang path prefix (${firstPathComponent}), redirecting`
			);
			return originalPath.replace(`/${firstPathComponent}`, '');
		}
	} else if (requestLanguage !== firstPathComponent) {
		// must redirect either by correcting the lang prefix or inserting it
		const cleanOriginal = originalPath.replace(
			new RegExp(`^/(${supportedLangs.join('|')})/`),
			'/'
		);
		return `/${requestLanguage}${cleanOriginal}`;
	}
	return request.url.pathname;
};
