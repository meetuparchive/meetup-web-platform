module.exports =
/******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = 38);
/******/ })
/************************************************************************/
/******/ ({

/***/ 38:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(4);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi actions/authActionCreators\n// module id = 38\n// module chunks = 10\n\n//# sourceURL=webpack:///multi_actions/authActionCreators?");

/***/ },

/***/ 4:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony export */ exports[\"loginPost\"] = loginPost;/* harmony export */ exports[\"configureAuth\"] = configureAuth;/* harmony export */ exports[\"loginSuccess\"] = loginSuccess;/* harmony export */ exports[\"loginError\"] = loginError;/* harmony export */ exports[\"logoutRequest\"] = logoutRequest;/* harmony export */ exports[\"logoutSuccess\"] = logoutSuccess;/* harmony export */ exports[\"logoutError\"] = logoutError;/**\n * @module authActionCreators\n */\n\n/**\n * Create a 'POST' action with onSuccess that parses the API response and\n * returns either a loginError action (API successfully returned, but the\n * response indicates login failure) or a loginSuccess action. onError always\n * returns a loginError action\n * @param {Object} params object with 'email' and 'password' props\n */\nfunction loginPost(params) {\n\tvar LOGIN_REF = 'login';\n\treturn {\n\t\ttype: 'LOGIN_POST',\n\t\tpayload: {\n\t\t\tquery: {\n\t\t\t\ttype: 'login',\n\t\t\t\tparams: params,\n\t\t\t\tref: LOGIN_REF\n\t\t\t},\n\t\t\tonSuccess: function onSuccess(_ref) {\n\t\t\t\tvar queries = _ref.queries;\n\t\t\t\tvar responses = _ref.responses;\n\n\t\t\t\t// get the response `value`\n\t\t\t\tvar response = responses.slice()[0][LOGIN_REF];\n\t\t\t\t// check for errors reported by API (will be handled by loginError)\n\n\t\t\t\tif (response.value.errors) {\n\t\t\t\t\treturn loginError(response.value.errors);\n\t\t\t\t}\n\t\t\t\t// otherwise return the action\n\t\t\t\treturn loginSuccess(response);\n\t\t\t},\n\t\t\tonError: loginError\n\t\t}\n\t};\n}\n\nfunction configureAuth(auth, isServer) {\n\treturn {\n\t\ttype: 'CONFIGURE_AUTH',\n\t\tpayload: auth,\n\t\tmeta: isServer\n\t};\n}\n\nfunction loginSuccess(response) {\n\treturn {\n\t\ttype: 'LOGIN_SUCCESS',\n\t\tpayload: response\n\t};\n}\n\nfunction loginError(response) {\n\treturn {\n\t\ttype: 'LOGIN_ERROR',\n\t\tpayload: response\n\t};\n}\n\nfunction logoutRequest() {\n\treturn {\n\t\ttype: 'LOGOUT_REQUEST'\n\t};\n}\n\nfunction logoutSuccess(auth) {\n\treturn {\n\t\ttype: 'LOGOUT_SUCCESS',\n\t\tpayload: auth\n\t};\n}\n\nfunction logoutError() {\n\treturn {\n\t\ttype: 'LOGOUT_ERROR'\n\t};\n}\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/actions/authActionCreators.js\n// module id = 4\n// module chunks = 3 10\n\n//# sourceURL=webpack:///./src/actions/authActionCreators.js?");

/***/ }

/******/ });