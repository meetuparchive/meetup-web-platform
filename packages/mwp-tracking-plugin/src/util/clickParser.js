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

	try {
		const data = (el.dataset || {})[DATA_ATTR] || '{}';
		return JSON.parse(data);
	} catch (err) {
		// data is not JSON-formatted
		return {};
	}
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
			const tagName = el.tagName.toLowerCase();
			if (tagName !== 'a' && tagName !== 'button' && !el.dataset[DATA_ATTR]) {
				// ignore all events on non-anchor/button elements that do not have data-clicktrack
				return;
			}

			const linkText = el.textContent
				.trim()
				.substring(0, 16) // truncate if text is long
				.replace(/\s{2,}/g, ' ');
			const clickLineage = [];
			const targetPosition = el.getBoundingClientRect();
			const docMidlineOffset = document.body.clientWidth / 2;
			const x = Math.round(targetPosition.left - docMidlineOffset);
			const y = Math.round(targetPosition.top);
			const data = _getData(e);

			// 1. Build array of DOM tag lineage
			clickLineage.push(elementShorthand(el)); // full shorthand for clicked el
			var currentEl = el;
			while (
				(currentEl = currentEl.parentNode) &&
				currentEl !== document.body
			) {
				clickLineage.push(elementShorthand(currentEl, true)); // id/tag only for parents
			}

			// 2. Create click action with metadata
			const now = new Date(); // TODO: make this a America/New_York timestamp
			return {
				timestamp: now.toISOString(),
				lineage: clickLineage.join('<'),
				linkText: linkText,
				coords: [x, y],
				data: data,
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
