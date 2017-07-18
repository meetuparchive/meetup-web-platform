// @flow
import { getLanguage, getPrefixedPath } from './util';

/*
 * This plugin provides two `request` helpers:
 * - `getLanguage`: get the request's language code (xx-XX)
 * - `getPrefixedPath`: get the correct request path relative to the request's
 *   specified language
 */
export default function register(
	server: Object,
	options: ?Object,
	next: () => void
) {
	server.decorate('request', 'getLanguage', getLanguage, {
		apply: true,
	});
	server.decorate('request', 'getPrefixedPath', getPrefixedPath, {
		apply: true,
	});

	next();
}

register.attributes = {
	name: 'mwp-language',
	version: '1.0.0',
};
