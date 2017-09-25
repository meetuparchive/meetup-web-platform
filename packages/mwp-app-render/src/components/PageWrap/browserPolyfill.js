/**
 * @param {String} localeCode the 'xx-XX' language code for the app
 * @return {String} the polyfill.io cdn string
 */
export function polyfillServiceUrl(localeCode) {
	const features = [
		'fetch', // IE, Safari
		'Intl',
		`Intl.~locale.${localeCode}`,
		'Promise',
		'URL',
		'Array.prototype.find', // IE
		'Array.prototype.includes', // IE
		'Array.from', // IE
		'String.prototype.endsWith', // IE
		'String.prototype.startsWith', // IE
		'String.prototype.includes', // IE
	];
	const flags = [
		'gated', // use feature detection in addition to user agent test
	];
	return `https://cdn.polyfill.io/v2/polyfill.min.js?features=${features.join()}&flags=${flags.join()}`;
}
