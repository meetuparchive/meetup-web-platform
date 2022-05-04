import { getISOStringNow, getOriginalEventId, getEventSource } from './trackingUtils';

const DATA_ATTR = 'clicktrack';

/*
 * This module provides utilities for handling browser-based click event data,
 * including the dispatch of corresponding Redux actions
 */

// set reference to un-modified stopPropagation
const originalStopPropagation =
	typeof Event !== 'undefined' && Event.prototype.stopPropagation;

/**
 * Overriding stopPropagation for maximum click tracking
 * @param {Function} trackClick function to track clicks
 * @return {undefined} side effects only
 */
export function trackStopPropagation(trackClick) {
	/**
	 * A special Event object method that hooks the click tracking into events
	 * that would never bubble to document.body
	 */
	Event.prototype.stopPropAndTrack = function() {
		trackClick(this);
		return originalStopPropagation.call(this);
	};

	// override stopPropagation to track clicks
	Event.prototype.stopPropagation = function() {
		if (this.type === 'click') {
			trackClick(this);
		}
		return originalStopPropagation.call(this);
	};
}

/**
 * Get a descriptive string for the HTML element passed in, e.g.
 *
 * `tagName#id.class1.class2`
 *
 * @param {HTMLElement} element the element to describe
 * @param {Boolean} idOnly only use id in description
 */
function elementShorthand(element, idOnly) {
	const id = element.id ? `#${element.id}` : '';
	if (id && idOnly) {
		return id;
	}
	const tag = element.tagName.toLowerCase();
	const classes = `.${[...element.classList].join('.')}`;

	return `${tag}${id}${classes}`;
}

function _getData(e) {
	const target = e.target;
	const useChildData =
		e.type === 'change' && target.tagName.toLowerCase() === 'select';
	const el = useChildData ? target.children[target.selectedIndex] : target;

	// pass along _any_ string value in data-clicktrack attribute
	return (el.dataset || {})[DATA_ATTR] || '';
}

// recursive function to build an array of 'element shorthand' strings for the
// passed-in `el` _starting with the first a/button/[DATA_ATTR] element_
function getLineage(lineage, el) {
	if (el === window.document.body || lineage.length > 20) {
		// end of the line
		return lineage;
	}
	const tagName = el.tagName.toLowerCase();
	if (
		lineage.length > 0 || // we have started
		tagName === 'a' || // or found an anchor
		tagName === 'button' || // or found a button
		el.dataset[DATA_ATTR] // or found a manually-tagged element
	) {
		lineage.push(elementShorthand(el, true));
	}
	// tail recursion FTW
	return getLineage(lineage, el.parentNode);
}

function getElementName(element) {
	/* Recursively search for the closest element with a dataset elementName field. */
	const searchElementName = el => {
		if (!el.tagName || el === window.document.body) {
			return '';
		}

		if (el.dataset && el.dataset.elementName) {
			return el.dataset.elementName;
		}
		return searchElementName(el.parentNode);
	};

	return searchElementName(element);
}

function getContainerName(element) {
	/* Recursively search for the closest element with a dataset elementName field. */
	const searchElementName = el => {
		if (!el.tagName || el === window.document.body) {
			return '';
		}

		if (el.dataset && el.dataset.containerName) {
			return el.dataset.containerName;
		}
		return searchElementName(el.parentNode);
	};

	return searchElementName(element);
}

function getRecommendationId(el) {
	if (!el) {
		return '';
	}
	if (el.dataset && el.dataset.recommendationid) {
		return el.dataset.recommendationid;
	}
	return getRecommendationId(el.parentElement);
}

function getRecommendationSource(el) {
	if (!el) {
		return '';
	}
	if (el.dataset && el.dataset.recommendationsource) {
		return el.dataset.recommendationsource;
	}
	return getRecommendationSource(el.parentElement);
}

function getEventRef(el) {
	if (!el) {
		return '';
	}
	if (el.dataset && el.dataset.eventref) {
		return el.dataset.eventref;
	}
	return getEventRef(el.parentElement);
}

function getTrackClick() {
	/**
	 * Event handler that emits data about each in-page click
	 *
	 * metadata: {
	 *   "lineage": <String representing 'this' location in DOM>,
	 *   "linkText": <this.text>,
	 *   "coords": [x offset from midline (elinate screen-width dependency, y (top) offset],
	 *   "data": { data on clicked element matching the tracking suffix }
	 * }
	 *
	 * @param  {Event} e the click (or other) DOM event
	 * @return {Object} a Redux action describing the click
	 */
	function trackClick(e) {
		try {
			const el = e.target;
			const clickLineage = getLineage([], el);
			if (clickLineage.length === 0) {
				return;
			}

			const linkText = el.textContent
				.trim()
				.substring(0, 16) // truncate if text is long
				.replace(/\s{2,}/g, ' ');
			const targetPosition = el.getBoundingClientRect();
			const docMidlineOffset = document.body.clientWidth / 2;
			const x = Math.round(targetPosition.left - docMidlineOffset);
			const y = Math.round(targetPosition.top);
			const data = _getData(e);
			const elementName = getElementName(el);
			const containerName = getContainerName(el);
			const recId = getRecommendationId(el);
			const recSource = getRecommendationSource(el);
			const eventRef = getEventRef(el);

			// 2. Create click action with metadata
			return {
				timestamp: getISOStringNow(),
				lineage: clickLineage.join('<'),
				linkText: linkText,
				coords: [x, y],
				tag: data,
				elementName,
				containerName,
				...(recId
					? {
							recId,
							recSource,
					  }
					: {}),
				...(eventRef
					? {
							eventRef: getOriginalEventId(eventRef),
							eventSource: getEventSource(eventRef),
					  }
					: {}),
			};
		} catch (err) {
			console.error(err);
		}
	}

	// modify window.Event prototype
	trackStopPropagation(trackClick);

	return trackClick;
}

export default getTrackClick;
