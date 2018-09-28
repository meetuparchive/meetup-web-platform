// @flow
import * as React from 'react';

type Props = React$ElementConfig<HTMLImageElement> & { mark: string };
type State = {
	loaded: boolean,
};

/*
window.UXCaptureImageOnLoad = (ev: SyntheticEvent<*>) => {
	if (window.UX) {
		window.UX.mark(mark);
	}
};
*/

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

	componentDidMount() {
		this.state.loaded = true;
	}

	render() {
		const { mark, src, ...other } = this.props;

		if (this.state.loaded) {
			return <img src={src} {...other} />;
		}

		return (
			<div
				dangerouslySetInnerHTML={{
					__html: `
					<img src="${src}" onload="console.log('${mark}')" />
				`,
				}}
			/>
		);
	}
}
