import React from 'react';
import locales from 'mwp-config/locales';

/**
 * Generates array of React.element's of <link />'s containing canonical + locale urls for the path provided
 * @param  {String} baseUrl base url of the page (protocol + hostname)
 * @param  {String} localeCode   locale of user
 * @param  {String} route route currently being viewed
 * @return {String}  composed canonical url
 */
export const generateCanonicalUrl = (baseUrl, localeCode, route) => {
	if (localeCode === 'en-US') {
		return `${baseUrl}${route}`;
	}
	return `${baseUrl}/${localeCode}${route}`;
};

/**
 * Generates array of React.element's of <link />'s containing
 * canonical + locale urls for the path provided
 * @param  {String} baseUrl base url of the page (protocol + hostname)
 * @param  {String} localeCode   locale of user
 * @param  {String} route   redux'd route to the current page
 * @return {Array}  array of React.element's
 */
export const generateCanonicalUrlLinkTags = (baseUrl, localeCode, route) => {
	const localeLinks = locales.map(locale => (
		<link
			rel="alternate"
			hreflang={locale == 'en-US' ? 'en' : locale}
			href={generateCanonicalUrl(baseUrl, locale, route)}
			key={locale}
		/>
	));

	return [
		...localeLinks,
		<link
			rel="alternate"
			hreflang="x-default"
			href={`${baseUrl}${route}`}
			key="default"
		/>,
		<link
			rel="canonical"
			href={generateCanonicalUrl(baseUrl, localeCode, route)}
			key="canonical"
		/>,
	];
};
