import url from 'url';

const makeRedirect = originalUrl => redirectPathname =>
	url.format({ ...originalUrl, pathname: redirectPathname });

export default request => () => {
	const { supportedLangs } = request.server.settings.app;
	const requestLanguage = request.getLanguage();
	const originalPath = request.url.pathname;
	const firstPathComponent = originalPath.split('/')[1];
	const redirect = makeRedirect(request.url);
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
