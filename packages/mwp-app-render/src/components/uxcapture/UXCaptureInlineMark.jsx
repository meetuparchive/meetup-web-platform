// @flow
import React from 'react';

type Props = {
	mark: string,
};

const generateUXCaptureJS = (mark: string) => `
	<script>
		if(window.UX) {
			UX.mark("${mark}");
		}
	</script>
`;

// inject inline UX.mark() call into rendered markup
// @see https://github.com/meetup/ux-capture#text-without-custom-font
const UXCaptureInlineMark = ({ mark }: Props) =>
	<div dangerouslySetInnerHTML={{ __html: generateUXCaptureJS(mark) }} />; // eslint-disable-line react/no-danger

export default UXCaptureInlineMark;
