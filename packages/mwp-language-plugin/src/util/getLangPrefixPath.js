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
			const prefixedPath = originalPath.replace(`/${firstPathComponent}`, '');
			request.log(
				['info'],
				`Unncessary lang path prefix (${firstPathComponent})`
			);
			return prefixedPath;
		}
	} else if (requestLanguage !== firstPathComponent) {
		// must correct/insert the correct lang prefix
		const cleanOriginal = originalPath.replace(
			new RegExp(`^/(${supportedLangs.join('|')})/`),
			'/'
		);
		return `/${requestLanguage}${cleanOriginal}`;
	}
	return request.url.pathname;
};
