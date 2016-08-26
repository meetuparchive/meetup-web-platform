(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", [], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory();
	else
		root["meetup-web-platform"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 47);
/******/ })
/************************************************************************/
/******/ ({

/***/ 16:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__api__ = __webpack_require__(6);

/* harmony export */ __webpack_require__.d(exports, "MOCK_APP_STATE", function() { return MOCK_APP_STATE; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_ROUTES", function() { return MOCK_ROUTES; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_API_PROBLEM", function() { return MOCK_API_PROBLEM; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_API_RESULT", function() { return MOCK_API_RESULT; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_RENDERPROPS", function() { return MOCK_RENDERPROPS; });
/* harmony export */ __webpack_require__.d(exports, "mockQuery", function() { return mockQuery; });
/* harmony export */ __webpack_require__.d(exports, "mockQueryBadType", function() { return mockQueryBadType; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_AUTH_HEADER", function() { return MOCK_AUTH_HEADER; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_DATETIME", function() { return MOCK_DATETIME; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_CREDENTIALS", function() { return MOCK_CREDENTIALS; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_POST_ACTION", function() { return MOCK_POST_ACTION; });var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };



var MOCK_APP_STATE = {
	app: {
		self: {
			type: 'member',
			value: { id: 1234 }
		},
		group: {
			type: 'group',
			value: __WEBPACK_IMPORTED_MODULE_0__api__["MOCK_GROUP"]
		},
		events: {
			type: 'event',
			value: [_extends({}, __WEBPACK_IMPORTED_MODULE_0__api__["MOCK_EVENT"], { id: 3456 }), _extends({}, __WEBPACK_IMPORTED_MODULE_0__api__["MOCK_EVENT"], { id: 4567 })]
		}
	},
	auth: {},
	config: {},
	routing: {
		locationBeforeTransitions: {}
	}
};

var MOCK_ROUTES = {
	path: '/',
	component: {},
	query: function query() {}
};

var MOCK_API_PROBLEM = {
	problem: 'There was an internal problem in the API'
};

var MOCK_API_RESULT = [{
	ref: 'group',
	type: 'group',
	value: MOCK_APP_STATE.app.group.value
}];

var MOCK_RENDERPROPS = {
	location: { // https://github.com/reactjs/history/blob/master/docs/Location.md
		pathname: '/foo',
		search: '',
		state: {},
		action: 'PUSH',
		key: '1234'
	},
	params: {
		urlname: 'foo'
	}
};

var mockQuery = function mockQuery(_ref) {
	var location = _ref.location;
	var params = _ref.params;

	return {
		type: 'group',
		params: params,
		ref: 'group'
	};
};

var mockQueryBadType = function mockQueryBadType(_ref2) {
	var location = _ref2.location;
	var params = _ref2.params;

	var type = 'lkajlhsdhljaskliub';
	return _extends({}, mockQuery({ location: location, params: params }), { type: type });
};

var MOCK_AUTH_HEADER = 'Bearer abcdefg';
var MOCK_DATETIME = new Date().getTime();
var MOCK_CREDENTIALS = {
	username: 'Michael McGahan',
	pw: 'whatever'
};

var MOCK_POST_ACTION = {
	type: 'POST_DUMMY',
	payload: {
		query: {},
		onSuccess: function onSuccess(result) {
			return { type: 'MOCK_SUCCESS' };
		},
		onError: function onError(err) {
			return { type: 'MOCK_ERROR' };
		}
	}
};

/***/ },

/***/ 47:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(16);


/***/ },

/***/ 6:
/***/ function(module, exports, __webpack_require__) {

"use strict";

/* harmony export */ __webpack_require__.d(exports, "MOCK_MEMBER", function() { return MOCK_MEMBER; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_SELF", function() { return MOCK_SELF; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_SELF_FR", function() { return MOCK_SELF_FR; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_DUOTONES", function() { return MOCK_DUOTONES; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_DUOTONE_URLS", function() { return MOCK_DUOTONE_URLS; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_GROUP", function() { return MOCK_GROUP; });
/* harmony export */ __webpack_require__.d(exports, "MOCK_EVENT", function() { return MOCK_EVENT; });var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var MOCK_MEMBER = {
	name: 'mocky mcmockerson',
	id: 1243,
	photo: {
		photo_link: 'http://placekitten.com/g/400/400'
	}
};

var MOCK_SELF = _extends({}, MOCK_MEMBER, { lang: 'en_US' });
var MOCK_SELF_FR = _extends({}, MOCK_MEMBER, { lang: 'fr_FR' });

var MOCK_DUOTONES = [['a', 'b']];
var MOCK_DUOTONE_URLS = {
	dtaxb: 'http://a.b'
};

var MOCK_GROUP = {
	id: 1234,
	urlname: 'fake-hq-faff',
	key_photo: {
		id: 1234,
		photo_link: 'http://placekitten.com/400/300',
		thumb_link: 'http://placekitten.com/400/300'
	},
	group_photo: {
		id: 1234,
		photo_link: 'http://placekitten.com/400/300',
		thumb_link: 'http://placekitten.com/400/300'
	},
	name: 'fake HQ FAFF',
	who: 'Faffers',
	members: 999,
	photo_gradient: {
		light_color: MOCK_DUOTONES[0][1],
		dark_color: MOCK_DUOTONES[0][0]
	},
	event_sample: [{
		id: 1234,
		name: 'Sample event',
		time: new Date().getTime(),
		yes_rsvp_count: 50
	}]
};

var oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
var oneMonthFuture = new Date();
oneMonthFuture.setMonth(oneMonthFuture.getMonth() + 1);
var MOCK_EVENT = {
	id: 123456,
	comment_count: 5,
	created: oneMonthAgo.getTime(),
	description: 'The coolest event in the world during which we will run and dance and sing\n\t<script>alert("bad time")</script>, 😊, &lt;blink&gt;what what&lt;blink&gt; this is getting\n\tlonger than it needs to be why am I still typing omg',
	duration: 3600000,
	name: 'So much fun',
	rsvp_sample: [{
		created: 1462833255609,
		id: 1234,
		member: MOCK_MEMBER,
		updated: 1462833255610
	}, {
		created: 1462833255609,
		id: 2345,
		member: _extends({}, MOCK_MEMBER, { id: 8912894 }),
		updated: 1462833255610
	}, {
		created: 1462833255609,
		id: 3456,
		member: _extends({}, MOCK_MEMBER, { id: 899828 }),
		updated: 1462833255610
	}],
	rsvpable: true,
	group: MOCK_GROUP,
	self: {
		actions: ['rsvp'],
		pay_status: 'none',
		rsvp: {}
	},
	status: 'upcoming',
	time: oneMonthFuture.getTime(),
	utc_offset: 0,
	visibility: 'public',
	yes_rsvp_count: 23
};

/***/ }

/******/ })
});
;