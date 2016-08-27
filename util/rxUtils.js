(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("rx"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["rx"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("rx"));
	else
		root["meetup-web-platform"] = factory(root["rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
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

/***/ 0:
/***/ function(module, exports) {

eval("module.exports = require(\"rx\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"rx\"\n// module id = 0\n// module chunks = 0 1 2 3 4 7\n\n//# sourceURL=webpack:///external_%22rx%22?");

/***/ },

/***/ 2:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx__ = __webpack_require__(0);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_rx__);\n\n/* harmony export */ __webpack_require__.d(exports, \"catchAndReturn$\", function() { return catchAndReturn$; });\n/**\n * Utilities to help with Observable sequences\n *\n * @module rxUtils\n */\n\n/**\n * utility to log errors and return a curried fallback value\n *\n * @param {Object} errorResponse anything to return in an observable\n * @param {Object} log (optional) A logging function\n * @param {Error} error (in curried return function) The error to handle\n * @returns {Observable} single-element observable\n */\nvar catchAndReturn$ = function catchAndReturn$(errorResponse, log) {\n  return function (error) {\n    log = log || console.log;\n    console.warn('Error: ' + error.message);\n    log(['error'], error.stack);\n\n    return __WEBPACK_IMPORTED_MODULE_0_rx___default.a.Observable.just(errorResponse || { error: error });\n  };\n};\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/util/rxUtils.js\n// module id = 2\n// module chunks = 0 2 7\n\n//# sourceURL=webpack:///./src/util/rxUtils.js?");

/***/ },

/***/ 47:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(2);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi util/rxUtils\n// module id = 47\n// module chunks = 7\n\n//# sourceURL=webpack:///multi_util/rxUtils?");

/***/ }

/******/ })
});
;