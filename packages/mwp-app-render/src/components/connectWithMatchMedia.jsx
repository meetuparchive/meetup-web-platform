// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import withMatchMedia from 'meetup-web-components/lib/utils/components/withMatchMedia';

const mapStateToProps = (state: MWPState) => ({
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
	WrappedComponent: React.ComponentType<Props>
): React.ComponentType<*> => {
	const MediaWrappedComponent = withMatchMedia(WrappedComponent);
	const ConnectWithMatchMedia = (props: $Diff<{ media: MatchMedia }, Props>) =>
		<MediaWrappedComponent {...props} initialMedia={props.media} />;

	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	ConnectWithMatchMedia.displayName = `ConnectWithMatchMedia(${wrappedComponentName})`;

	return connect(mapStateToProps)(ConnectWithMatchMedia);
};

export default connectWithMatchMedia;
