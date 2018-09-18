// @flow
import React from 'react';

type Props = {|
	destinationVerified?: Array<string>,
	primaryContentDisplayed?: Array<string>,
	primaryActionAvailable?: Array<string>,
	secondaryContentDisplayed?: Array<string>,
|};

const generateUXCaptureExpectJS = (
	destinationVerified: ?Array<string>,
	primaryContentDisplayed: ?Array<string>,
	primaryActionAvailable: ?Array<string>,
	secondaryContentDisplayed: ?Array<string>
) => {
	const zones = [];

	if (destinationVerified && destinationVerified.length > 0) {
		zones.push({
			label: 'ux-destination-verified',
			marks: destinationVerified,
		});
	}

	if (primaryContentDisplayed && primaryContentDisplayed.length > 0) {
		zones.push({
			label: 'ux-primary-content-displayed',
			marks: primaryContentDisplayed,
		});
	}

	if (primaryActionAvailable && primaryActionAvailable.length > 0) {
		zones.push({
			label: 'ux-primary-action-available',
			marks: primaryActionAvailable,
		});
	}

	if (secondaryContentDisplayed && secondaryContentDisplayed.length > 0) {
		zones.push({
			label: 'ux-secondary-content-displayed',
			marks: secondaryContentDisplayed,
		});
	}

	return `
		<script>
			if(window.UX) {
				UX.expect(${JSON.stringify(zones)});
			}
		</script>
	`;
};

export default ({
	destinationVerified,
	primaryContentDisplayed,
	primaryActionAvailable,
	secondaryContentDisplayed,
}: Props) => {
	const uxCaptureJS = generateUXCaptureExpectJS(
		destinationVerified,
		primaryContentDisplayed,
		primaryActionAvailable,
		secondaryContentDisplayed
	);

	return (
		<div dangerouslySetInnerHTML={{ __html: uxCaptureJS }} /> // eslint-disable-line react/no-danger
	);
};
