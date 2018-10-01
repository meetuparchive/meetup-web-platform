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

	if (window && window.UX && window.UX[`${mark}-LOADED`]) {
		console.log(`${mark}-LOADED`);
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

	return (
		<div
			dangerouslySetInnerHTML={{
				__html: `
				<img id="ux-capture-${mark}" src="${src}" onload="${onloadSingleLine}" />
			`,
			}}
		/>
	);
};

export default UXCaptureImageLoad;
