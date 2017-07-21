// @flow
import url from 'url';

export default (languageRenderers: { [string]: LanguageRenderer$ }) => (
	request: HapiRequest,
	reply: HapiReply
) => {
	const pathname = request.getPrefixedPath();
	if (pathname !== request.url.pathname) {
		return reply.redirect(url.format({ ...request.url, pathname }));
	}
	const requestLanguage = request.getLanguage();
	const renderRequest = languageRenderers[requestLanguage];

	renderRequest(request).subscribe(
		(renderResult: RenderResult) => {
			if (renderResult.redirect) {
				return reply
					.redirect(renderResult.redirect.url)
					.permanent(Boolean(renderResult.redirect.permanent));
			}
			request.trackSession();
			return reply(renderResult.result).code(renderResult.statusCode);
		},
		err => reply(err) // 500 error - will only be thrown on bad implementation
	);
};
