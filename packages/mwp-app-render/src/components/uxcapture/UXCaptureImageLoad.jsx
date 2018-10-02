// @flow
import * as React from 'react';

type Props = React$ElementConfig<typeof HTMLImageElement> & { mark: string };

export const getOnLoadJS = (mark: string): string => {
	const onload = `
		if (window.UX && !window.UX['${mark}-LOADED']) {
			window.UX.mark('${mark}');
			window.UX['${mark}-LOADED'] = true;
		}
	`;

	// Replace newlines and tabs with space characters
	return onload.replace(/[\n\t]+/g, ' ');
};

export const getPropsAsHTMLAttrs = (
	props: React$ElementConfig<typeof HTMLImageElement>
): string => {
	// TODO: other props need to be mapped from camelCase / JSX syntax
	return Object.keys(props).map(prop => `${prop}="${props[prop]}"`).join(' ');
};

/**
 * Creates an image tag with provide props
 * and a UXCapture `onLoad` handler
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
const UXCaptureImageLoad = (props: Props) => {
	const { mark, src, ...other } = props;

	const onload = getOnLoadJS(mark);
	const otherImgAttrs = getPropsAsHTMLAttrs(other);

	return (
		<div
			dangerouslySetInnerHTML={{
				__html: `
				<img id="ux-capture-${mark}" src="${src}" onload="${onload}" ${otherImgAttrs} />
			`,
			}}
		/>
	);
};

export default UXCaptureImageLoad;
