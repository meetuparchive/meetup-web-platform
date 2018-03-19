/**
 * @param {String} localeCode the 'xx-XX' language code for the app
 * @return {String} the polyfill.io cdn string
 */
export function polyfillServiceUrl(localeCode) {
	/*
	 * the majority of these polyfills are need for IE 11 and Safari 10
	 * and whatever if required for partial support of slightly older browsers
	 */
	const features = [
		'default-3.6', // This includes a _lot_ of common polyfils - check https://polyfill.io/v2/docs/features/
		'fetch', // IE, Safari
		'Intl',
		`Intl.~locale.${localeCode}`,
		'Array.prototype.find', // IE
		'Array.prototype.includes', // IE
		'Object.values', // IE, Safari
	];
	const flags = [
		'gated', // use feature detection in addition to user agent test
	];
	return `https://cdn.polyfill.io/v2/polyfill.min.js?features=${features.join()}&flags=${flags.join()}`;
}
