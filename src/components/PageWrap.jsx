import React from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';

import { polyfillServiceUrl } from '../util/browserPolyfill';

/*
 * This just imports a blob of JS that New Relic give us so we can track usage/errors from real
 * users. We should only need to upgrade it in the event New Relic makes a major change, which
 * they'll let us know about.
 */
import { newrelicBrowserJS } from '../util/newrelicBrowser';

/*
 * -- Inline SVG icon sprite --
 *
 * raw SVG sprite from `swarm-icons`
 */
const iconSpriteStyle = { display: 'none' };
const iconSprite = require('raw-loader!swarm-icons/dist/sprite/sprite.inc');

/*
 * Swarm logos
 */
const swarmFavicon = require('file-loader!../assets/favicon.ico');
const swarmIcon120x120 = require('file-loader!../assets/logos/m_swarm_120x120.png');
const swarmIcon128x128 = require('file-loader!../assets/logos/m_swarm_128x128.png');
const swarmIcon152x152 = require('file-loader!../assets/logos/m_swarm_152x152.png');
const swarmIcon180x180 = require('file-loader!../assets/logos/m_swarm_180x180.png');
const swarmIcon196x196 = require('file-loader!../assets/logos/m_swarm_196x196.png');

/**
 * This component wraps all pages on the website, and through [Helmet](https://github.com/nfl/react-helmet/)
 * sets up base CSS, favicons, javascript, and our New Relic RUM/error reporting (see `newrelicBrowserJS` above).
 *
 * @module PageWrap
 */
class PageWrap extends React.Component {
	/**
	 * This method ensures important app state props passed
	 * from `AppContainer` are passed to children (feature containers)
	 *
	 * @method renderChildren
	 * @returns {Array} Children with mapped props
	 */
	renderChildren() {
		const { self, localeCode, location } = this.props;

		return React.Children.map(this.props.children, (child, key) =>
			React.cloneElement(child, { self, localeCode, location, key })
		);
	}

	/**
	 * @return {React.element} the page wrapping component
	 */
	render() {
		const { localeCode, baseCSSHref, webfontCSSHref } = this.props;

		// Parse localeCode for ISO 639-1 languages code.
		// (ie. 'en', 'it', etc)
		// @see https://github.com/meetup/swarm-sasstools/blob/master/scss/utils/helpers/_i18n.scss
		const lang = localeCode.substring(0, 2);

		return (
			<div
				id="root"
				className={`column lang_${lang}`}
				style={{ minHeight: '100vh' }}
			>
				<Helmet defaultTitle="Meetup" titleTemplate="%s - Meetup">
					<link rel="stylesheet" type="text/css" href={webfontCSSHref} />
					<link rel="stylesheet" type="text/css" href={baseCSSHref} />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
					<meta http-equiv="X-UA-Compatible" content="IE=edge" />
					<meta name="robots" content="index,follow" />
					<meta
						name="verify-v1"
						content="h5EhuAEkLFlZmMxwpH5wnRaoDEmqYCCEUE+FLcrRNvE="
					/>
					<link
						rel="apple-touch-icon"
						sizes="120x120"
						href={swarmIcon120x120}
					/>
					<link rel="shortcut icon" sizes="128x128" href={swarmIcon128x128} />
					<link rel="shortcut icon" href={swarmFavicon} />
					<link
						rel="apple-touch-icon"
						sizes="152x152"
						href={swarmIcon152x152}
					/>
					<link
						rel="apple-touch-icon"
						sizes="180x180"
						href={swarmIcon180x180}
					/>
					<link rel="shortcut icon" sizes="196x196" href={swarmIcon196x196} />

					<script type="text/javascript" src={polyfillServiceUrl(localeCode)} />
					<script type="text/javascript">
						{newrelicBrowserJS}
					</script>
				</Helmet>

				<div
					style={iconSpriteStyle}
					dangerouslySetInnerHTML={{ __html: iconSprite }}
				/>

				{this.renderChildren()}
			</div>
		);
	}
}

PageWrap.propTypes = {
	localeCode: PropTypes.string.isRequired,
	self: PropTypes.object.isRequired,
	location: PropTypes.object.isRequired,
};

export default PageWrap;
