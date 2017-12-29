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
 * connectWithMatchMediaComponent
 * HOC that provides an `initialMedia` prop based on `media` in state.config which is determined by user agent
 * because withMatchMedia cannot detect the media until after initial render.
 *
 * `media` prop is provided from redux state in config.
 */
const connectWithMatchMedia = <Props: {}>(
	WrappedComponent: React.ComponentType<Props>,
): ConnectedComponentClass<*,$Diff<{ initialMedia: MatchMedia }, Props>> => {
	const MediaWrappedComponent = withMatchMedia(WrappedComponent);
	const ConnectWithMatchMedia = (props: $Diff<{ media: MatchMedia }, Props>) => (
		<MediaWrappedComponent {...props} initialMedia={props.media} />
	);

	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	ConnectWithMatchMedia.displayName = `ConnectWithMatchMedia(${wrappedComponentName})`;

	return connect(mapStateToProps)(ConnectWithMatchMedia);
};

export default connectWithMatchMedia;
