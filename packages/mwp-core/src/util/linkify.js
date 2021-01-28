// @flow

// Regex to match urls, copied from url-regex v3. Modified to not match closing parantheses ')' at the end of the url string
var urlRegex = new RegExp(
	/(?:(?:(?:[a-z]+:)?\/\/)|www\.)(?:\S+(?::\S*)?@)?(?:localhost|(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]([^\s"()]|[(][^\s"]*?[)])*)?/gi
);

const getRelAttr = (followedExternalDomains, link, target) => {
	if (!followedExternalDomains.length) {
		return target === '_blank' ? 'rel="nofollow noopener noreferrer"' : '';
	}
	try {
		const urlObj = new URL(link);
		const domain = urlObj.hostname.replace('www.', '');
		if (domain === 'meetup.com') {
			return '';
		} else if (followedExternalDomains.includes(domain)) {
			return 'rel="ugc"';
		}
		return 'rel="nofollow ugc"';
	} catch (error) {
		return 'rel="nofollow ugc"';
	}
};

/**
 * Generates HTML link tag element with target
 *
 * @method createLink
 * @param {Object} options optional modifiers
 * @param {String} href string of link passed through options
 * @return {String} The HTML link tag
 */
const createLink = (options: Object, followedExternalDomains: Array<string> = []) => (
	href: string
): string => {
	const target = options.target || '';
	const targetAttr = `target="${target}"`;
	const hasProtocolRE = /^(?:https?:|ws:|ftp:)?\/\//;
	const link = hasProtocolRE.test(href) ? href : `http://${href}`;
	const relAttr = getRelAttr(followedExternalDomains, link, target);

	return `<a class="link" href="${link}" title="${href}" ${targetAttr} ${relAttr}>${href}</a>`;
};

/**
 * Replaces URLs in a block of text with HTML anchor tags.
 *
 * @method linkify
 * @param {String} text The text on which to operate
 * @param {Object} options optional modifiers
 * @return {String} The modified text.
 */
export default function linkify(
	text: string,
	options?: Object = {},
	followedExternalDomains: Array<string>
): string {
	if (!text) {
		return '';
	}
	return text.replace(urlRegex, createLink(options, followedExternalDomains));
}
