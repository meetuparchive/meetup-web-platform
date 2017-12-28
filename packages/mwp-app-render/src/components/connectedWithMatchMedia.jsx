//@flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { MapStateToProps } from 'react-redux';
import { createStructuredSelector, createSelector } from 'reselect';
import withMatchMedia from 'meetup-web-components/lib/utils/components/withMatchMedia';

const mapStateToProps: MapStateToProps<*, *, *> = (state: MWPState) => ({
	defaultMedia: state.config.media,
});

/**
 * connectedWithMatchMediaComponent
 * HOC that provides a default based on `media` in state.config which is determined by user agent
 * because withMatchMedia cannot detect the media until after initial render.
 *
 * `defaultMedia` prop is an alias for `media` provided from redux state in config.
 * `media` prop is passed from `withMatchMedia`.
 * component determines whether to use defaultMedia, or media from withMatchMedia.
 */
const connectedWithMatchMedia = <Props: {}>(
	WrappedComponent: React.ComponentType<Props>
): React.ComponentType<Props> => {
	const ConnectedWithMatchMedia = ({ defaultMedia, media, ...props }) => {
		const useDefault = Object.keys(media || {}).length === 0;
		return (
			<WrappedComponent
				{...props}
				media={useDefault ? defaultMedia : media}
			/>
		);
	};
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	ConnectedWithMatchMedia.displayName = `ConnectedWithMatchMedia(${wrappedComponentName})`;

	const ConnectedComponent = connect(mapStateToProps)(
		ConnectedWithMatchMedia
	);

	return withMatchMedia(ConnectedComponent);
};

export default connectedWithMatchMedia;
