import React from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import newrelic from 'newrelic';

/**
 * This component wraps all pages on the website, and through [Helmet](https://github.com/nfl/react-helmet/)
 * sets up base CSS, favicons, & javascript
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

	componentDidMount() {
		if (typeof document !== 'undefined') {
			const headEl = document.getElementsByTagName('head')[0];
			if (headEl) {
				headEl.appendChild(
					document.createElement(newrelic.getBrowserTimingHeader())
				);
			}
		}

		// Browser has now rendered client-side application - fire the browser TTI trigger
		if (window.newrelic) {
			const now = new Date().getTime();
			// 1. Set a marker in the trace details
			window.newrelic.addToTrace({
				name: 'appInteractive',
				start: now,
				type: 'Browser app has rendered and is interactive',
			});
			// 2. Add a custom attribute to the PageView & BrowserInteraction events in Insights
			window.performance &&
				window.newrelic.setCustomAttribute(
					'timeToAppInteractive',
					now - window.performance.timing.navigationStart // this is the event that NR uses as 'start' of page load
				);
		}
	}

	/**
	 * @return {React.element} the page wrapping component
	 */
	render() {
		const { head, iconSprite, localeCode } = this.props;

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
				{head}

				<Helmet defaultTitle="Meetup" titleTemplate="%s - Meetup">
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
					<meta http-equiv="X-UA-Compatible" content="IE=edge" />
					<meta name="robots" content="index,follow" />
					<meta
						name="verify-v1"
						content="h5EhuAEkLFlZmMxwpH5wnRaoDEmqYCCEUE+FLcrRNvE="
					/>
				</Helmet>

				{iconSprite &&
					<div
						style={{ display: 'none' }}
						dangerouslySetInnerHTML={{ __html: iconSprite }}
					/>}

				{this.renderChildren()}
			</div>
		);
	}
}

PageWrap.propTypes = {
	head: PropTypes.object,
	iconSprite: PropTypes.string,
	localeCode: PropTypes.string.isRequired,
	location: PropTypes.object.isRequired,
	self: PropTypes.object.isRequired,
};

export default PageWrap;
