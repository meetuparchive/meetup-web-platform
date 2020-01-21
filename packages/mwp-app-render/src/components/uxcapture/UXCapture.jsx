// @flow
import * as React from 'react';
import UXCaptureCreate from './UXCaptureCreate';
import UXCaptureStartView from './UXCaptureStartView';

type Props = {|
	destinationVerified?: Array<string>,
	primaryContentDisplayed?: Array<string>,
	primaryActionAvailable?: Array<string>,
	secondaryContentDisplayed?: Array<string>,
|};

export const onMark = () => {
	if (!(window.performance && window.performance.getEntriesByType)) {
		return;
	}
};

export const onMeasure = () => {
	if (!(window.performance && window.performance.getEntriesByType)) {
		return;
	}
};

export default ({
	destinationVerified,
	primaryContentDisplayed,
	primaryActionAvailable,
	secondaryContentDisplayed,
}: Props) => (
	<React.Fragment>
		<UXCaptureCreate onMark={onMark} onMeasure={onMeasure} />
		<UXCaptureStartView
			destinationVerified={destinationVerified}
			primaryContentDisplayed={primaryContentDisplayed}
			primaryActionAvailable={primaryActionAvailable}
			secondaryContentDisplayed={secondaryContentDisplayed}
		/>
	</React.Fragment>
);
