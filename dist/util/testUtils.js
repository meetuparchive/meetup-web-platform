(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react-addons-test-utils"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["react-addons-test-utils"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("react-addons-test-utils"));
	else
		root["meetup-web-platform"] = factory(root["react-addons-test-utils"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_33__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 48);
/******/ })
/************************************************************************/
/******/ ({

/***/ 17:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils__);
/* harmony export */ exports["findComponentsWithType"] = findComponentsWithType;
/* harmony export */ __webpack_require__.d(exports, "createFakeStore", function() { return createFakeStore; });
/* harmony export */ __webpack_require__.d(exports, "middlewareDispatcher", function() { return middlewareDispatcher; });

function findComponentsWithType(tree, typeString) {
	return __WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils___default.a.findAllInRenderedTree(tree, function (component) {
		return component && component.constructor.name === typeString;
	});
}

var createFakeStore = function createFakeStore(fakeData) {
	return {
		getState: function getState() {
			return fakeData;
		},
		dispatch: function dispatch() {},
		subscribe: function subscribe() {}
	};
};

var middlewareDispatcher = function middlewareDispatcher(middleware) {
	return function (storeData, action) {
		var dispatched = null;
		var dispatch = middleware(createFakeStore(storeData))(function (actionAttempt) {
			return dispatched = actionAttempt;
		});
		dispatch(action);
		return dispatched;
	};
};

/***/ },

/***/ 33:
/***/ function(module, exports) {

module.exports = require("react-addons-test-utils");

/***/ },

/***/ 48:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(17);


/***/ }

/******/ })
});
;