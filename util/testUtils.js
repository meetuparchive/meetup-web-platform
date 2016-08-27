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
eval("/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils__ = __webpack_require__(33);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils__);\n/* harmony export */ exports[\"findComponentsWithType\"] = findComponentsWithType;\n/* harmony export */ __webpack_require__.d(exports, \"createFakeStore\", function() { return createFakeStore; });\n/* harmony export */ __webpack_require__.d(exports, \"middlewareDispatcher\", function() { return middlewareDispatcher; });\n\nfunction findComponentsWithType(tree, typeString) {\n\treturn __WEBPACK_IMPORTED_MODULE_0_react_addons_test_utils___default.a.findAllInRenderedTree(tree, function (component) {\n\t\treturn component && component.constructor.name === typeString;\n\t});\n}\n\nvar createFakeStore = function createFakeStore(fakeData) {\n\treturn {\n\t\tgetState: function getState() {\n\t\t\treturn fakeData;\n\t\t},\n\t\tdispatch: function dispatch() {},\n\t\tsubscribe: function subscribe() {}\n\t};\n};\n\nvar middlewareDispatcher = function middlewareDispatcher(middleware) {\n\treturn function (storeData, action) {\n\t\tvar dispatched = null;\n\t\tvar dispatch = middleware(createFakeStore(storeData))(function (actionAttempt) {\n\t\t\treturn dispatched = actionAttempt;\n\t\t});\n\t\tdispatch(action);\n\t\treturn dispatched;\n\t};\n};\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/util/testUtils.js\n// module id = 17\n// module chunks = 6\n\n//# sourceURL=webpack:///./src/util/testUtils.js?");

/***/ },

/***/ 33:
/***/ function(module, exports) {

eval("module.exports = require(\"react-addons-test-utils\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"react-addons-test-utils\"\n// module id = 33\n// module chunks = 6\n\n//# sourceURL=webpack:///external_%22react-addons-test-utils%22?");

/***/ },

/***/ 48:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(17);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi util/testUtils\n// module id = 48\n// module chunks = 6\n\n//# sourceURL=webpack:///multi_util/testUtils?");

/***/ }

/******/ })
});
;