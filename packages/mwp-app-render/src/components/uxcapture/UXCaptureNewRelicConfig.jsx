// @flow
import React from 'react';
import UXCaptureConfig from './UXCaptureConfig';

export const onMark = (mark: string) => {
	if (window.newrelic) {
		const now = new Date().getTime();

		// Set a marker in the trace details
		window.newrelic.addToTrace({
			name: mark,
			start: now,
			type: 'UX Capture mark',
		});

		//  Add a custom attribute to the PageView & BrowserInteraction events in Insights
		if (window.performance) {
			// `window performance.timing.navigationStart` is the event that NR uses as 'start' of page load
			const timeToMark = now - window.performance.timing.navigationStart;
			window.newrelic.setCustomAttribute(mark, timeToMark);
		}
	}
};

export const onMeasure = (measure: string) => {
	if (window.newrelic) {
		const now = new Date().getTime();

		window.newrelic.addToTrace({
			name: measure,
			start: now,
			type: 'UX Capture measure',
		});

		if (window.performance) {
			const timeToMeasure = now - window.performance.timing.navigationStart;
			window.newrelic.setCustomAttribute(measure, timeToMeasure);
		}
	}
};

export default () => <UXCaptureConfig onMark={onMark} onMeasure={onMeasure} />;
