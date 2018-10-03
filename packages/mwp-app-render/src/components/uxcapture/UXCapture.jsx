// @flow
import * as React from 'react';
import UXCaptureExpect from './UXCaptureExpect';
import UXCaptureConfig from './UXCaptureConfig';

type Props = {|
	destinationVerified?: Array<string>,
	primaryContentDisplayed?: Array<string>,
	primaryActionAvailable?: Array<string>,
	secondaryContentDisplayed?: Array<string>,
	onMark?: callbackType,
	onMeasure?: callbackType,
|};

export default ({
	destinationVerified,
	primaryContentDisplayed,
	primaryActionAvailable,
	secondaryContentDisplayed,
	onMark,
	onMeasure,
}: Props) =>
	<React.Fragment>
		<UXCaptureConfig onMeasure={onMeasure} onMark={onMark} />
		<UXCaptureExpect
			destinationVerified={destinationVerified}
			primaryContentDisplayed={primaryContentDisplayed}
			primaryActionAvailable={primaryActionAvailable}
			secondaryContentDisplayed={secondaryContentDisplayed}
		/>
	</React.Fragment>;
