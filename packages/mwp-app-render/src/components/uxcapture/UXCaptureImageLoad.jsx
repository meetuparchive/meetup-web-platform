// @flow
import * as React from 'react';

type Props = {
	mark: string,
	src: string,
};

/**
 * Creates an image tag with provide props
 * and a UXCapture `onLoad` handler
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
const UXCaptureImageLoad = (props: Props) => {
	const { mark, src, ...other } = props;

	// TODO: handle merging of onLoad prop

	const onLoadCallback = () => {
		if (window.UX) {
			window.UX.mark(mark);
		}
	};

	return <img src={src} {...other} onLoad={onLoadCallback} />;
};

export default UXCaptureImageLoad;
