// @flow
import { getLanguage, getLanguageRedirect } from './util';
export default function register(
	server: Object,
	options: ?Object,
	next: () => void
) {
	server.decorate('request', 'getLanguage', getLanguage, {
		apply: true,
	});
	server.decorate('request', 'getLanguageRedirect', getLanguageRedirect, {
		apply: true,
	});

	next();
}

register.attributes = {
	name: 'mwp-language',
	version: '1.0.0',
};
