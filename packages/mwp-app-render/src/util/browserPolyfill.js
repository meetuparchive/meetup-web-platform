// @flow

/**
 * List of useragent sub-strings that don't require a polyfill
 */
export const userAgentPolyfillBlacklist = ['Chrome', 'Firefox'];

/**
 * @param {String} localeCode the 'xx-XX' language code for the app
 * @return {String} the polyfill.io cdn string
 */
export const polyfillServiceUrl = (localeCode: string): string => {
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
};

/**
 * If the userAgent does not contain any of the blacklist strings,
 * then return the polyfill url
 *
 * @param {String} userAgent  userAgent string of the current request
 * @param {String} localeCode xx-XX locale string for current request
 * @returns {Boolean|String} the polyfill service url or false
 */
export const getPolyfill = (
	userAgent: ?string,
	localeCode: string
): boolean | string =>
	!userAgentPolyfillBlacklist.some(ua => (userAgent || '').includes(ua)) &&
	polyfillServiceUrl(localeCode);
