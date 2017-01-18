
export const URL_REGEX = /((((ht|f){1}(tps?:[/][/]){1}))[-a-zA-Z0-9@:;%_\+.~#?&/=]+)/gm;

/**
 * Generates HTML link tag element with target
 *
 * @method createLink
 * @param {Object} options optional modifiers
 * @param {String} href string of link passed through options
 * @return {String} The HTML link tag
 */
const createLink = options => href => {
	const target = options.target || '';
	const targetAttr = `target="${target}"`;
	const relAttr = target === '_blank' ? ' rel="noopener noreferrer"' : '';

	return `<a href="${href}" title="${href}" ${targetAttr}${relAttr}>${href}</a>`;
}

/**
 * Replaces URLs in a block of text with HTML anchor tags.
 *
 * @method linkify
 * @param {String} text The text on which to operate
 * @param {Object} options optional modifiers
 * @return {String} The modified text.
 */
export default function linkify(text, options) {
	if (!text) {
		return '';
	}

	return text.replace(URL_REGEX, createLink(options || {}));
}
