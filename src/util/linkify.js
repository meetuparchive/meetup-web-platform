
/**
 * Replaces URLs in a block of text with HTML anchor tags.
 *
 * @method linkify
 * @param {String} text The text on which to operate
 * @param {Object} options optional modifiers
 * @param {Boolean} [options.target] what to set as the target attribute
 * @return {String} The modified text.
 */
export default function linkify(text, options) {
	if (!text) return '';
	options = options || {};

	const urlRegex = /((((ht|f){1}(tps?:[/][/]){1}))[-a-zA-Z0-9@:;%_\+.~#?&/=]+)/gm,
		createLink = (href) => {
			const target = options.target || '',
				targetAttr = `target="${target}"`;

			if (target === '_blank') {
				targetAttr += ' rel="noopener noreferrer"';
			}

			return `<a href="${href}" title="${href}" ${targetAttr}>${href}</a>`;
		};

	return text.replace(urlRegex, createLink);
}
