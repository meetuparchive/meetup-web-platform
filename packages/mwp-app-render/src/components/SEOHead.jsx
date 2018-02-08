import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

import {
	DEFAULT_TITLE,
	generateMetaData,
	generateCanonicalUrlMetaTags,
	generateMetaTags,
} from 'src/util/seoHelper';

export const DEFAULT_IMAGE_URL =
	'https://secure.meetupstatic.com/s/img/286374644891845767035/logo/meetup-logo-script-1200x630.png';
/**
 * Generates SEO Helmet object
 * Note: props passed to SEOHead should *not* be html-escaped because this is handled by Helmet
 * @see https://github.com/nfl/react-helmet
 * @module SEOHead
 */
export const SEOHeadComponent = ({
	robots,
	pageTitle,
	pageDescription,
	ogTitle,
	ogDescription,
	pageKeywords,
	ldJson,
	baseUrl,
	localeCode,
	route,
	pageMeta,
	imageUrl,
}) => {
	const meta = generateMetaData({
		title: pageTitle,
		description: pageDescription,
		keywords: pageKeywords,
		ogTitle,
		ogDescription,
		baseUrl,
		route,
		appPath: `meetup:/${route}`,
		imageUrl,
		localeCode,
	});

	// generate meta tags based on gathered data
	const metaTags = generateMetaTags([...meta, ...pageMeta]);

	const canonicalUrlTags = generateCanonicalUrlMetaTags(baseUrl, localeCode, route);

	const ldJsonTags = ldJson.map((jsonObj, index) => (
		// TODO: refactor
		// eslint-disable-next-line react/no-array-index-key
		<script type="application/ld+json" key={`ldjson-${index}`}>
			{JSON.stringify(jsonObj)}
		</script>
	));

	return (
		<Helmet defaultTitle="Meetup" titleTemplate="%s | Meetup">
			<title>{pageTitle}</title>
			<link rel="image_src" href={imageUrl} />

			{robots ? (
				<meta name="robots" content="index, follow" />
			) : (
				<meta name="robots" content="noindex, nofollow" />
			)}

			{metaTags}

			{canonicalUrlTags}

			{ldJsonTags}
		</Helmet>
	);
};

SEOHeadComponent.propTypes = {
	baseUrl: PropTypes.string.isRequired,
	imageUrl: PropTypes.string,
	ldJson: PropTypes.array,
	localeCode: PropTypes.string,
	pageDescription: PropTypes.string,
	pageKeywords: PropTypes.string,
	pageMeta: PropTypes.array,
	pageTitle: PropTypes.string,
	ogTitle: PropTypes.string,
	ogDescription: PropTypes.string,
	robots: PropTypes.bool,
	route: PropTypes.string.isRequired,
};

SEOHeadComponent.defaultProps = {
	pageMeta: [],
	localeCode: 'en-US',
	pageTitle: DEFAULT_TITLE,
	robots: true,
	ldJson: [],
	imageUrl: DEFAULT_IMAGE_URL,
};

export default SEOHeadComponent;
