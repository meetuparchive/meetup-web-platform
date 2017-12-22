import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector, createSelector } from 'reselect';
import withMatchMedia from 'meetup-web-components/lib/utils/components/withMatchMedia';

/**
 * getConfig
 * @param  {Object} state
 * @return {Object} the config from state
 */
const getConfig = state => state.config || {};

/**
 * Checks if object is empty
 * @param  {Object} object
 * @return {Boolean} whether object is empty
 */
const isEmpty = object => object === undefined || Object.keys(object).length === 0;

/**
 * @param {Object} device - object containing device information
 * @returns {Object} - default media object for `withMatchMedia`
 */
const getMediaOrDefault = (media, device) => {
	if (!isEmpty(media)) {
		return media;
	}
	if ( !isEmpty(device) ) {
		const {isMobile, isTablet, isDesktop} = device;
		const isTabletOrDesktop = isTablet || isDesktop;
		return {
			isAtSmallUp: Boolean(isMobile || isTabletOrDesktop),
			isAtMediumUp: Boolean(isTabletOrDesktop),
			isAtLargeUp: Boolean(isDesktop),
		}
	}
	return {};
};

const mapStateToProps = createStructuredSelector({
	device: createSelector(getConfig, config => (config.device || {})),
});

/**
 * connectedWithMatchMediaComponent
 * HOC that provides a default based on `device` in state.config
 * if withMatchMedia has not yet detected the media
 *
 * `device` prop is provided from redux state in config.
 * `media` prop is provided to the wrapped component in render().
 *
 * @returns {React.element}
 */
const connectedWithMatchMedia = WrappedComponent => {

	/**
	 * @module ConnectedWithMatchMedia
	 */

	class ConnectedWithMatchMedia extends React.Component {

		render() {
			const {device, media: currentMedia } = this.props;
			const media = getMediaOrDefault(currentMedia, device);
			return <WrappedComponent {...this.props} media={media}/>;
		}
	};
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	ConnectedWithMatchMedia.WrappedComponent = WrappedComponent;
	ConnectedWithMatchMedia.displayName = `ConnectedWithMatchMedia(${wrappedComponentName})`;
	
	/* connect to redux state */
	const ConnectedComponent = connect(mapStateToProps)(ConnectedWithMatchMedia);
	/* return wrapped component withMatchMedia */
	return withMatchMedia(ConnectedComponent);
};

export default connectedWithMatchMedia;
