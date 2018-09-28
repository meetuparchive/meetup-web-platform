// @flow
import * as React from 'react';

type Props = React$ElementConfig<HTMLImageElement> & { mark: string };

/**
 * Creates an image tag with provide props
 * and a UXCapture `onLoad` handler
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
const UXCaptureImageLoad = (props: Props) => {
	const { mark, src, ...other } = props;

	const onLoad = (ev: SyntheticEvent<*>) => {
		// trigger any existing onLoad prop
		if (props.onLoad) {
			props.onLoad(ev);
		}

		if (window.UX) {
			window.UX.mark(mark);
		}
	};

	return <img src={src} {...other} onLoad={onLoad} />;
};

export default UXCaptureImageLoad;
