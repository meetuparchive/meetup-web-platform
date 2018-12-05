// @flow
import * as React from 'react';
import cx from 'classnames';

/**
<ul>
	<UXCaptureInlineMark mark="ux-inline-text-tab-1">
		<li></li>
	</UXCaptureInlineMark>
	<UXCaptureInlineMark mark="ux-inline-text-tab-2">
		<li></li>
	</UXCaptureInlineMark>
	<UXCaptureInlineMark mark="ux-inline-text-tab-3">
		<li></li>
	</UXCaptureInlineMark>
	<li></li>
</ul>

<UXCaptureInlineMark mark="ux-text-inline">
	<h1>Page Title</h1>
</UXCaptureInlineMark>

 */

type Props = {
	mark: string,
	children: React$Node,
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
const UXCaptureInlineMarkWithSelector = ({ mark, children }: Props) => {
	const child = React.cloneElement(children, {
		className: cx(child.props.className, mark),
	});

	// eslint-disable-next react/no-danger
	return (
		<React.Fragment>
			{child}
			<div dangerouslySetInnerHTML={{ __html: generateUXCaptureJS(mark) }} />
		</React.Fragment>
	);
};

export default UXCaptureInlineMarkWithSelector;
