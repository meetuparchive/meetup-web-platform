// @flow
import React from 'react';

type callbackType = (label: string) => void;
type Props = {|
	onMark?: callbackType,
	onMeasure?: callbackType,
|};

export default ({ onMark, onMeasure }: Props) => {
	// No need to inject `UX.config()` script if no callbacks provided
	if (!onMark && !onMeasure) {
		return null;
	}

	const uxCaptureConfigJS = `
		<script>
			if(window.UX) {
				window.UX.config({
					${onMark ? `"onMark": ${onMark.toString()},` : ''}
					${onMeasure ? `"onMeasure": ${onMeasure.toString()},` : ''}
				});
			}
		</script>
	`;

	return (
		<div dangerouslySetInnerHTML={{ __html: uxCaptureConfigJS }} /> // eslint-disable-line react/no-danger
	);
};
