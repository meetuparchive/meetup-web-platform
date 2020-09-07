// @flow
const DUMMY_DOMAIN = 'http://mwp-dummy-domain.com';

export function getRedirect(context: { url?: string, permanent?: boolean }) {
	if (!context || !context.url) {
		return;
	}
	// use `URL` to ensure valid character encoding (e.g. escaped emoji)
	const url: string = context.url;
	const isFragment = url.startsWith('/');
	const urlToFormat = isFragment ? `${DUMMY_DOMAIN}${url}` : url;
	const formattedUrl = new URL(urlToFormat).toString();
	return {
		redirect: {
			url: formattedUrl.replace(DUMMY_DOMAIN, ''),
			permanent: context.permanent,
		},
	};
}

export default getRedirect;
