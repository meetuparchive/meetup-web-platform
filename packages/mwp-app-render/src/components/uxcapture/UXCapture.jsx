// @flow
import * as React from 'react';
import UXCaptureExpect from './UXCaptureExpect';
import UXCaptureNewRelicConfig from './UXCaptureNewRelicConfig';

type Props = {|
	destinationVerified?: Array<string>,
	primaryContentDisplayed?: Array<string>,
	primaryActionAvailable?: Array<string>,
	secondaryContentDisplayed?: Array<string>,
|};

export default ({
	destinationVerified,
	primaryContentDisplayed,
	primaryActionAvailable,
	secondaryContentDisplayed,
}: Props) =>
	<React.Fragment>
		<UXCaptureNewRelicConfig />
		<UXCaptureExpect
			destinationVerified={destinationVerified}
			primaryContentDisplayed={primaryContentDisplayed}
			primaryActionAvailable={primaryActionAvailable}
			secondaryContentDisplayed={secondaryContentDisplayed}
		/>
	</React.Fragment>;
