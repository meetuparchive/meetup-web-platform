export const coerceBool = s => {
	switch(s) {
	case 'true':
		return true;
	case 'false':
		return false;
	default:
		return s;
	}
};

/**
 * simple camel case function - not really interested in edge cases, just
 * straightforward 'this-is-hyphen' to 'thisIsHyphen'
 */
export function toCamelCase(s) {
	return s.replace(/-(\w)/g, g => g[1].toUpperCase());
}

/**
 *
 * It appears that sometimes we add some data that shouldn't be in cookies.
 * This removes surrounding quotes, URI encodes, and then unescapes the cookie
 * separator.
 *
 * @param {String} rawCookies A cookie header from the browser
 * @return {String} Properly esacaped and formatted cookies
 */

export function cleanRawCookies(rawCookies) {
	return encodeURI(
		rawCookies
	)
	.replace(/^[']|[']$/g, '') //replace surrounding single quotes
	.replace(/;%20/g, '; ') //Make sure we unencode the actual cookie separator
}


