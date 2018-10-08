// @flow
import * as React from 'react';
import UXCaptureExpect from './UXCaptureExpect';
import UXCaptureConfig from './UXCaptureConfig';

type Props = {|
	destinationVerified?: Array<string>,
	primaryContentDisplayed?: Array<string>,
	primaryActionAvailable?: Array<string>,
	secondaryContentDisplayed?: Array<string>,
|};

export const onMark = (mark: string) => {
	if (!(window.newrelic && window.performance)) {
		return;
	}

	const markStartTime = window.performance
		.getEntriesByType('mark')
		.find(entry => entry.name === mark).startTime;

	// Set a marker in the trace details
	window.newrelic.addToTrace({
		name: mark,
		start: markStartTime,
		type: 'UX Capture mark',
	});

	//  Add a custom attribute to the PageView & BrowserInteraction events in Insights
	// `window performance.timing.navigationStart` is the event that NR uses as 'start' of page load
	const timeToMark = markStartTime - window.performance.timeing.navigationStart;
	window.newrelic.setCustomAttribute(mark, timeToMark);
};

export const onMeasure = (measure: string) => {
	if (!(window.newrelic && window.performance)) {
		return;
	}

	const performanceMeasure = window.performance
		.getEntriesByType('measure')
		.find(entry => entry.name === measure);

	// Set a start time marker in trace details
	window.newrelic.addToTrace({
		name: `${measure}-startTime`,
		start: performanceMeasure.startTime,
		type: 'UX Capture measure',
	});

	// Set an end time marker in trace details:
	// TBD: not sure if we'll actually need this
	window.newrelic.addToTrace({
		name: `${measure}-endTime`,
		start: performanceMeasure.startTime + performanceMeasure.duration,
		type: 'UX Capture measure',
	});

	//  Add a custom attribute to the PageView & BrowserInteraction events in Insights
	// `window performance.timing.navigationStart` is the event that NR uses as 'start' of page load
	const timeToMeasure =
		performanceMeasure.startTime - window.performance.timing.navigationStart;
	window.newrelic.setCustomAttribute(measure, timeToMeasure);
};

export default ({
	destinationVerified,
	primaryContentDisplayed,
	primaryActionAvailable,
	secondaryContentDisplayed,
}: Props) =>
	<React.Fragment>
		<UXCaptureConfig onMark={onMark} onMeasure={onMeasure} />
		<UXCaptureExpect
			destinationVerified={destinationVerified}
			primaryContentDisplayed={primaryContentDisplayed}
			primaryActionAvailable={primaryActionAvailable}
			secondaryContentDisplayed={secondaryContentDisplayed}
		/>
	</React.Fragment>;
