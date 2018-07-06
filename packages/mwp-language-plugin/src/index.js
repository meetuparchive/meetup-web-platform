// @flow
import { getLanguage, getLangPrefixPath } from './util';

/*
 * This plugin provides two `request` helpers:
 * - `getLanguage`: get the request's language code (xx-XX)
 * - `getLangPrefixPath`: get the correct request path relative to the request's
 *   specified language
 */
export function register(server: HapiServer, options: ?Object) {
	server.decorate('request', 'getLanguage', getLanguage, {
		apply: true,
	});
	server.decorate('request', 'getLangPrefixPath', getLangPrefixPath, {
		apply: true,
	});
}

export const plugin = {
	register,
	name: 'mwp-language-plugin',
	version: '1.0.0',
};
