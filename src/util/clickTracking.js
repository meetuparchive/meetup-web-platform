import { click } from '../actions/clickActionCreators';
const DATA_ATTR = 'clicktrack';

function cleanTrackingUrl() {
	// TODO: investigate and refactor to support this feature

	/*
	// remove tracking information from the url to prevent bad link copying
	// and to clean up the url field

	var TRACKING_PARAM = '_xtd';
	if ( history && history.replaceState && window.location.href.indexOf(TRACKING_PARAM) > 0) {

		var baseUrl = window.location.href.split('?');

		//Make sure there was actually a query param.
		if (!baseUrl[1]) {
			return;
		}

		var qs = baseUrl[1].split('&');

		for (var i = 0, len = qs.length; i < len; i++) {
			if (qs[i] && qs[i].split('=')[0] === TRACKING_PARAM) {
				qs.splice(i, 1);
				break;
			}
		}

		history.replaceState({}, document.title, baseUrl[0] + '?' + qs.join('&'));
	}
	*/
}

// set reference to un-modified stopPropagation
const originalStopPropagation = typeof Event !== 'undefined' &&
	Event.prototype.stopPropagation;

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
	const classes = `.${[ ...element.classList ].join('.')}`;

	return `${tag}${id}${classes}`;
}

function _getData(e) {
	const target = e.target;
	const useChildData = e.type === 'change' && target.tagName.toLowerCase() === 'select';
	const el = useChildData ? target.children[target.selectedIndex] : target;

	try {
		const data = (el.dataset || {})[DATA_ATTR] || '{}';
		return JSON.parse(data);
	} catch(err) {
		// data is not JSON-formatted
		return {};
	}
}

function getTrackClick(store) {
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
		const el = e.target;
		if (e.type === 'change' && !e.target.dataset[DATA_ATTR]) {
			// ignore change events on elements without data-clicktrack
			return;
		}

		const linkText = el.textContent.trim().replace(/\s{2,}/g, ' ');
		const clickLineage = [];
		const targetPosition = el.getBoundingClientRect();
		const docMidlineOffset = document.body.clientWidth / 2;
		const x = Math.round(targetPosition.left - docMidlineOffset);
		const y = Math.round(targetPosition.top);
		const data = _getData(e);

		// 1. Build array of DOM tag lineage
		clickLineage.push(elementShorthand(el));  // full shorthand for clicked el
		var currentEl = el;
		while ((currentEl = currentEl.parentNode) && currentEl !== document.body) {
			clickLineage.push(elementShorthand(currentEl, true));  // id/tag only for parents
		}

		// 2. Create click action with metadata
		const clickTrackAction = click({
			lineage: clickLineage.join('<'),
			linkText: linkText,
			coords: [x, y],
			data: data
		});

		// 3. dispatch the action - must be deferred until after click event has
		//    been processed by all other listeners
		setTimeout(() => store.dispatch(clickTrackAction), 0);

		return clickTrackAction;
	}

	trackStopPropagation(trackClick);
	cleanTrackingUrl();

	return trackClick;
}

export default getTrackClick;

