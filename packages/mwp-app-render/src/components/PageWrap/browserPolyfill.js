/**
 * @param {String} localeCode the 'xx-XX' language code for the app
 * @return {String} the polyfill.io cdn string
 */
export function polyfillServiceUrl(localeCode) {
	const features = [
		'default-3.6', // This includes a _lot_ of common polyfils - check https://polyfill.io/v2/docs/features/
		'fetch', // IE, Safari
		'Array.prototype.find', // IE 11
		'Array.prototype.includes', // IE 11
		'Object.values', // IE 11
	];
	const flags = [
		'gated', // use feature detection in addition to user agent test
	];
	return `https://cdn.polyfill.io/v2/polyfill.min.js?features=${features.join()}&flags=${flags.join()}`;
}
