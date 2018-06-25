// @flow
import url from 'url';

/*
 * This is the Hapi route handler that will be applied to the React application
 * route (usually a wildcard handling all paths).
 *
 * It is primarily responsible for:
 *
 * 1. Ensuring that the current URL pathname matches the language specified by
 *    the request - redirect if not
 * 2. Render the application in the requested language
 * 3. Set 'Vary' header in order to cache based on device type in header.
 *    If 'X-UA-Device' is present, after caching, Fastly rewrites
 *    the Vary header to 'User-Agent', in order for the google bots
 *    to crawl mobile and desktop versions of the site
 */
export default (languageRenderers: { [string]: LanguageRenderer }): any => (
	request: HapiRequest,
	h: HapiResponseToolkit
): any => {
	const pathname = request.getLangPrefixPath();
	if (pathname !== request.url.pathname) {
		return h.redirect(url.format({ ...request.url, pathname }));
	}
	const requestLanguage = request.getLanguage();
	const renderRequest = languageRenderers[requestLanguage];

	return renderRequest(request).then(
		(renderResult: RenderResult): any => {
			if (renderResult.redirect) {
				return h
					.redirect(renderResult.redirect.url)
					.permanent(Boolean(renderResult.redirect.permanent));
			}
			return h
				.response(renderResult.result)
				.code(renderResult.statusCode)
				.header('vary', 'X-UA-Device'); // set by fastly
		},
		err => err // 500 error - will only be thrown on bad implementation
	);
};
