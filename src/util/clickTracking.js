const COOKIE_NAME = 'click-track';
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

/**
 * Overriding stopPropagation for maximum click tracking
 * @param {Function} trackClick function to track clicks
 * @return {undefined} side effects only
 */
function overrideNativeEventMethods(trackClick) {
	Event.prototype.originalStopPropagation = Event.prototype.stopPropagation;
	Event.prototype.stopPropagation = function() {
		if (this.originalEvent && this.originalEvent.type === 'click') {
			(this);
		}
		return this.originalStopPropagation();
	};

	/**
	 * A special jQuery events method that hooks the click tracking into events
	 * that would never bubble to document.body
	 */
	Event.prototype.stopPropAndTrack = function() {
		trackClick(this);
		return this.stopPropagation();  // ensure return value is the same as normal stopProp call
	};
}


function elementShorthand(element, idOnly) {
	// tagName#id.class1.class2
	var tag = element.tagName.toLowerCase(),
		id = element.id ? `#${element.id}` : '',
		classes = '',
		_reClass = /(\S+)/g;  // regex capture classes from element.className

	if (!idOnly) {
		classes = element.className ? `.${element.className.match(_reClass).join('.')}` : '';
	}

	return ((id && idOnly) ? '' : tag) + id + classes;
}

function activateClickTracking() {
	const _clickHistory = [];	// history of in-page clicks for *this request*

	const _fixedEncodeURIComponent = str =>
		encodeURIComponent(str).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);

	// TODO: rewrite w/o jquery
	function _getData(e) {
		const target = e.target;
		const useChildData = e.type === 'change' && target.tagName.toLowerCase() === 'select';
		const el = useChildData ? target.children[target.selectedIndex] : target;
		const data = el.dataset(DATA_ATTR);

		return typeof(data) === 'object' && !(data instanceof Array) ? data : {};
	}

	/**
	 * jQuery event handler that writes a history of in-page clicks for the
	 * current request to a session cookie. For each click, a map of metadata
	 * is appended to a list, which is saved back to the cookie.
	 *
	 * The 'history' is reset on every request.
	 *
	 * metadata:
	 * {
	 *   "lineage": <String representing 'this' location in DOM>,
	 *   "linkText": <this.text>,
	 *   "coords": [x offset from midline (elinate screen-width dependency, y (top) offset],
	 *   "data": { data on clicked element matching the tracking suffix }
	 * }
	 *
	 * @param  {Event} e [description]
	 */
	function _trackClickHandler(e) {
		const el = e.target;
		if (e.type === 'change' && !e.target.dataset(DATA_ATTR)) {
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
		let cookieVal;

		// 1. Build array of DOM tag lineage
		clickLineage.push(elementShorthand(el));  // full shorthand for clicked el
		var currentEl = el;
		while ((currentEl = currentEl.parentNode) && currentEl !== document.body) {
			clickLineage.push(elementShorthand(currentEl, true));  // id/tag only for parents
		}

		// 2. Assemble click metadata and add to _clickHistory
		_clickHistory.push({
			lineage: clickLineage.join('<'),
			linkText: linkText,
			coords: [x, y],
			data: data
		});
		cookieVal = JSON.stringify({ history: _clickHistory });
		while (cookieVal.length > 4000) {  // 4000 chars leaves room for url-encoding chars
			// remove oldest click and try again
			_clickHistory.shift();
			cookieVal = JSON.stringify({ history: _clickHistory });
		}

		// TODO: use js-cookie to set cookie
		Cookies.setCookie(
			COOKIE_NAME,
			_fixedEncodeURIComponent(cookieVal),
			null, null, null, null,
			true
		);  // we are doing the URI encoding ourselves, skip `escape`
	}

	overrideNativeEventMethods(_trackClickHandler);

	/**
	 * Attached the tracking click handler
	 * @param  {jQuery} $
	 * @param  {muModule} Cookies provides setCookie
	 */
	function trackClicks() {
		// Passing `true` in `event.data` causes the event handler to check if
		// the target has a `data-hdfs` attribute. If so, it defers handling the
		// event to the event listener delegated to the `data-hdfs` data attribute.
		document.body.addEventListenter('click', _trackClickHandler);
		document.body.addEventListenter('change', _trackClickHandler);

		cleanTrackingUrl();

	}

	return trackClicks;
}

export default activateClickTracking;

