// @flow
import React from 'react';

type callbackType = (label: string) => mixed;
type Props = {|
	onMark?: callbackType,
	onMeasure?: callbackType,
|};

export default ({ onMark, onMeasure }: Props) => {
	const config = {};

	// No need to inject `UX.config()` script if no callbacks provided
	if (!onMark && !onMeasure) {
		return null;
	}

	if (onMark) {
		config['onMark'] = onMark.toString();
	}

	if (onMeasure) {
		config['onMeasure'] = onMeasure.toString();
	}

	const uxCaptureConfigJS = `
		<script>
			if(window.UX) {
				window.UX.config(${JSON.stringify(config)});
			}
		</script>
	`;

	return (
		<div dangerouslySetInnerHTML={{ __html: uxCaptureConfigJS }} /> // eslint-disable-line react/no-danger
	);
};
