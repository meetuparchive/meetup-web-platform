// @flow
import React from 'react';

type Props = {
	mark: string,
};

const generateUXCaptureJS = (mark: string) => `
	<script>
		if(window.UXCapture) {
			window.UXCapture.mark("${mark}");
		}
	</script>
`;

// inject inline UXCapture.mark() call into rendered markup
// @see https://github.com/meetup/ux-capture#text-without-custom-font
const UXCaptureInlineMark = ({ mark }: Props) =>
	<div dangerouslySetInnerHTML={{ __html: generateUXCaptureJS(mark) }} />; // eslint-disable-line react/no-danger

export default UXCaptureInlineMark;
