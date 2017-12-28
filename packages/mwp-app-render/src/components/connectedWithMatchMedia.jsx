//@flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { MapStateToProps, ConnectedComponentClass } from 'react-redux';
import { createStructuredSelector, createSelector } from 'reselect';
import withMatchMedia from 'meetup-web-components/lib/utils/components/withMatchMedia';

const mapStateToProps: MapStateToProps<*, *, *> = (state: MWPState) => ({
	media: state.config.media,
});

/**
 * connectedWithMatchMediaComponent
 * HOC that provides an `initialMedia` prop based on `media` in state.config which is determined by user agent
 * because withMatchMedia cannot detect the media until after initial render.
 *
 * `media` prop is provided from redux state in config.
 */
const connectedWithMatchMedia = <Props: {}>(
	WrappedComponent: React.ComponentType<Props>
): ConnectedComponentClass<*, *> => {
	const MediaWrappedComponent = withMatchMedia(WrappedComponent);
	const ConnectedWithMatchMedia = props => (
		<MediaWrappedComponent {...props} initialMedia={props.media} />
	);
	//
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	ConnectedWithMatchMedia.displayName = `ConnectedWithMatchMedia(${wrappedComponentName})`;

	return connect(mapStateToProps)(ConnectedWithMatchMedia);
};

export default connectedWithMatchMedia;
