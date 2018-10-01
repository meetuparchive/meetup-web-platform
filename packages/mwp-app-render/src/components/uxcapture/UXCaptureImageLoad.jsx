// @flow
import * as React from 'react';

type Props = React$ElementConfig<HTMLImageElement> & { mark: string };
type State = {
	loaded: boolean,
};

/**
 * Creates an image tag with provide props
 * and a UXCapture `onLoad` handler
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
export default class UXCaptureImageLoad extends React.Component<Props, State> {
	state = {
		loaded: false,
	};

	getDerivedStateFromProps(nextProps, prevState) {
		if (window && window.UX && window.UX[`${nextProps.mark}-LOADED`]) {
			console.log(`${nextProps.mark}-LOADED`);
			return {
				loaded: true,
			};
		}
	}

	render() {
		const { mark, src, ...other } = this.props;

		if (this.state.loaded) {
			return <img src={src} {...other} />;
		}

		const onload = `
			if (window.UX) {
				window.UX.mark(${mark});
				console.log('MARKED: ${mark}');
			}
			window.UX.${mark}-LOADED = true;
		`;

		const onloadSingleLine = onload.replace(/[\n\t]+/g, ' ');

		// TODO: add other props to img html tag
		return (
			<div
				dangerouslySetInnerHTML={{
					__html: `
					<img id="ux-capture-${mark}" src="${src}" onload="${onloadSingleLine}" />
				`,
				}}
			/>
		);
	}
}
