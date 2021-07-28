import React from 'react';
import locales from 'mwp-config/locales';

/**
 * Generates array of React.element's of <link />'s containing canonical + locale urls for the path provided
 * @param  {String} baseUrl base url of the page (protocol + hostname)
 * @param  {String} localeCode   locale of user
 * @param  {String} forcedLocaleCode   locale of group
 * @param  {String} route route currently being viewed
 * @return {String}  composed canonical url
 */
export const generateCanonicalUrl = (
	baseUrl,
	localeCode,
	route,
	forcedLocaleCode
) => {
	const newLocaleCode = forcedLocaleCode || localeCode;
	if (newLocaleCode === 'en-US') {
		return `${baseUrl}${route}`;
	}
	return `${baseUrl}/${newLocaleCode}${route}`;
};

/**
 * Generates array of React.element's of <link />'s containing
 * canonical + locale urls for the path provided
 * @param  {String} baseUrl base url of the page (protocol + hostname)
 * @param  {String} localeCode   locale of user
 * @param  {String} forcedLocaleCode  locale of group
 * @param {Boolean} isGenerateAlternateLinks Defines if we need to generate alternate link tags for the page
 * @param  {String} route   redux'd route to the current page
 * @return {Array}  array of React.element's
 */
export const generateCanonicalUrlLinkTags = (
	baseUrl,
	localeCode,
	route,
	forcedLocaleCode = '',
	isGenerateAlternateLinks
) => {
	let result = [
		<link
			rel="canonical"
			href={generateCanonicalUrl(baseUrl, localeCode, route, forcedLocaleCode)}
			key="canonical"
		/>,
	];

	if (forcedLocaleCode) {
		return result;
	}

	const localeLinks = locales.reduce((acc, locale) => {
		const locationDependentTag = (
			<link
				rel="alternate"
				hrefLang={locale == 'en-US' ? 'en' : locale}
				href={generateCanonicalUrl(baseUrl, locale, route)}
				key={locale}
			/>
		);

		// Google recommends adding location-independent tags for each hreflang tag that includes a location
		// We skip 'es' and 'es-ES' as they are already both supported in locales array
		// and 'en-US' \ 'en-AU' as 'en' hreflang is rendered by default
		if (
			locale !== 'en-US' &&
			locale !== 'en-AU' &&
			locale !== 'es' &&
			locale !== 'es-ES'
		) {
			const localeParts = locale.split('-');
			if (localeParts.length === 2) {
				const locationIndependentTag = (
					<link
						rel="alternate"
						hrefLang={localeParts[0]}
						href={generateCanonicalUrl(baseUrl, locale, route)}
						key={localeParts[0]}
					/>
				);

				return [...acc, locationDependentTag, locationIndependentTag];
			}
		}
		return [...acc, locationDependentTag];
	}, []);

	const alternateLinks = isGenerateAlternateLinks
		? [
				...localeLinks,
				<link
					rel="alternate"
					hrefLang="x-default"
					href={`${baseUrl}${route}`}
					key="default"
				/>,
		  ]
		: '';

	result = [...result, ...alternateLinks];

	return result;
};
