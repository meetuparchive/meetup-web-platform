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
/******/ 	return __webpack_require__(__webpack_require__.s = 45);
/******/ })
/************************************************************************/
/******/ ({

/***/ 45:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(6);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi util/mocks/api\n// module id = 45\n// module chunks = 9\n\n//# sourceURL=webpack:///multi_util/mocks/api?");

/***/ },

/***/ 6:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_MEMBER\", function() { return MOCK_MEMBER; });\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_SELF\", function() { return MOCK_SELF; });\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_SELF_FR\", function() { return MOCK_SELF_FR; });\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_DUOTONES\", function() { return MOCK_DUOTONES; });\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_DUOTONE_URLS\", function() { return MOCK_DUOTONE_URLS; });\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_GROUP\", function() { return MOCK_GROUP; });\n/* harmony export */ __webpack_require__.d(exports, \"MOCK_EVENT\", function() { return MOCK_EVENT; });var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };\n\nvar MOCK_MEMBER = {\n\tname: 'mocky mcmockerson',\n\tid: 1243,\n\tphoto: {\n\t\tphoto_link: 'http://placekitten.com/g/400/400'\n\t}\n};\n\nvar MOCK_SELF = _extends({}, MOCK_MEMBER, { lang: 'en_US' });\nvar MOCK_SELF_FR = _extends({}, MOCK_MEMBER, { lang: 'fr_FR' });\n\nvar MOCK_DUOTONES = [['a', 'b']];\nvar MOCK_DUOTONE_URLS = {\n\tdtaxb: 'http://a.b'\n};\n\nvar MOCK_GROUP = {\n\tid: 1234,\n\turlname: 'fake-hq-faff',\n\tkey_photo: {\n\t\tid: 1234,\n\t\tphoto_link: 'http://placekitten.com/400/300',\n\t\tthumb_link: 'http://placekitten.com/400/300'\n\t},\n\tgroup_photo: {\n\t\tid: 1234,\n\t\tphoto_link: 'http://placekitten.com/400/300',\n\t\tthumb_link: 'http://placekitten.com/400/300'\n\t},\n\tname: 'fake HQ FAFF',\n\twho: 'Faffers',\n\tmembers: 999,\n\tphoto_gradient: {\n\t\tlight_color: MOCK_DUOTONES[0][1],\n\t\tdark_color: MOCK_DUOTONES[0][0]\n\t},\n\tevent_sample: [{\n\t\tid: 1234,\n\t\tname: 'Sample event',\n\t\ttime: new Date().getTime(),\n\t\tyes_rsvp_count: 50\n\t}]\n};\n\nvar oneMonthAgo = new Date();\noneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);\nvar oneMonthFuture = new Date();\noneMonthFuture.setMonth(oneMonthFuture.getMonth() + 1);\nvar MOCK_EVENT = {\n\tid: 123456,\n\tcomment_count: 5,\n\tcreated: oneMonthAgo.getTime(),\n\tdescription: 'The coolest event in the world during which we will run and dance and sing\\n\\t<script>alert(\"bad time\")</script>, 😊, &lt;blink&gt;what what&lt;blink&gt; this is getting\\n\\tlonger than it needs to be why am I still typing omg',\n\tduration: 3600000,\n\tname: 'So much fun',\n\trsvp_sample: [{\n\t\tcreated: 1462833255609,\n\t\tid: 1234,\n\t\tmember: MOCK_MEMBER,\n\t\tupdated: 1462833255610\n\t}, {\n\t\tcreated: 1462833255609,\n\t\tid: 2345,\n\t\tmember: _extends({}, MOCK_MEMBER, { id: 8912894 }),\n\t\tupdated: 1462833255610\n\t}, {\n\t\tcreated: 1462833255609,\n\t\tid: 3456,\n\t\tmember: _extends({}, MOCK_MEMBER, { id: 899828 }),\n\t\tupdated: 1462833255610\n\t}],\n\trsvpable: true,\n\tgroup: MOCK_GROUP,\n\tself: {\n\t\tactions: ['rsvp'],\n\t\tpay_status: 'none',\n\t\trsvp: {}\n\t},\n\tstatus: 'upcoming',\n\ttime: oneMonthFuture.getTime(),\n\tutc_offset: 0,\n\tvisibility: 'public',\n\tyes_rsvp_count: 23\n};\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/util/mocks/api.js\n// module id = 6\n// module chunks = 8 9\n\n//# sourceURL=webpack:///./src/util/mocks/api.js?");

/***/ }

/******/ })
});
;