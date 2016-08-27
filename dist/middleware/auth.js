(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("js-cookie"), require("redux"), require("rx"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["js-cookie", "redux", "rx"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("js-cookie"), require("redux"), require("rx"));
	else
		root["meetup-web-platform"] = factory(root["js-cookie"], root["redux"], root["rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_31__, __WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_0__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 40);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports) {

eval("module.exports = require(\"rx\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"rx\"\n// module id = 0\n// module chunks = 0 1 2 3 4 7\n\n//# sourceURL=webpack:///external_%22rx%22?");

/***/ },

/***/ 1:
/***/ function(module, exports) {

eval("module.exports = require(\"redux\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"redux\"\n// module id = 1\n// module chunks = 1 3 4 5\n\n//# sourceURL=webpack:///external_%22redux%22?");

/***/ },

/***/ 11:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_js_cookie__ = __webpack_require__(31);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_js_cookie___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_js_cookie__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rx__ = __webpack_require__(0);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rx__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_redux__ = __webpack_require__(1);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_redux__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__ = __webpack_require__(4);\n/**\n * Auth middle handles all the server communication and cookie managmenet\n * related to login actions.\n *\n * We assume that the login API provides *both* an auth token and the member\n * object corresponding to the login credentials\n *\n * @module AuthMiddleware\n */\n\n\n\n\n\n/**\n * login sub responds to only the most recent login request, and can be disposed\n * by a logout\n * @const\n */\nvar loginSub = new __WEBPACK_IMPORTED_MODULE_1_rx___default.a.SerialDisposable();\nloginSub.setDisposable(__WEBPACK_IMPORTED_MODULE_1_rx___default.a.Disposable.empty);\n\n/**\n * There are 6 login-related actions:\n *\n * 1. 'LOGIN_REQUEST' - send credentials for login\n * 2. 'LOGIN_SUCCESS' - updates local state/cookie from api response\n * 3. 'LOGIN_ERROR' - server failed to login user with supplied credentials\n * 4. 'LOGOUT_REQUEST' - return to default state and request anonymous\n *   auth token from server\n * 5. 'LOGOUT_SUCCESS' - new anonymous auth token returned\n * 6. 'LOGOUT_ERROR' - server failed to get anonymous auth token - fatal\n */\nvar AuthMiddleware = function AuthMiddleware(store) {\n\treturn function (next) {\n\t\treturn function (action) {\n\t\t\tvar actions = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2_redux__[\"bindActionCreators\"])({\n\t\t\t\tlogoutSuccess: __WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__[\"logoutSuccess\"],\n\t\t\t\tlogoutError: __WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__[\"logoutError\"]\n\t\t\t}, store.dispatch);\n\n\t\t\tvar oauth_token = void 0,\n\t\t\t    response = void 0;\n\t\t\tswitch (action.type) {\n\t\t\t\tcase 'LOGIN_SUCCESS':\n\t\t\t\t\tresponse = action.payload;\n\t\t\t\t\toauth_token = response.value.oauth_token;\n\t\t\t\t\t__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.set('oauth_token', oauth_token);\n\t\t\t\t\t__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.remove('anonymous');\n\t\t\t\t\t// re-sync the page\n\t\t\t\t\tstore.dispatch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__[\"configureAuth\"])({ oauth_token: oauth_token }));\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGIN_ERROR':\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGOUT_REQUEST':\n\t\t\t\t\t__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.remove('oauth_token');\n\t\t\t\t\tfetch('/anon') // application server route to serve anonymous tokens\n\t\t\t\t\t.then(function (response) {\n\t\t\t\t\t\treturn response.json();\n\t\t\t\t\t}).catch(function (e) {\n\t\t\t\t\t\treturn Promise.reject([e]);\n\t\t\t\t\t}).then(actions.logoutSuccess, actions.logoutError);\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGOUT_SUCCESS':\n\t\t\t\t\tresponse = action.payload;\n\t\t\t\t\toauth_token = response.access_token;\n\t\t\t\t\t__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.set('oauth_token', oauth_token);\n\t\t\t\t\t__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.set('anonymous', true);\n\t\t\t\t\t// re-sync the page\n\t\t\t\t\tstore.dispatch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__[\"configureAuth\"])({ anonymous: true, oauth_token: oauth_token }));\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGOUT_ERROR':\n\t\t\t\t\tbreak;\n\t\t\t}\n\t\t\treturn next(action);\n\t\t};\n\t};\n};\n\n/* harmony default export */ exports[\"default\"] = AuthMiddleware;\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/middleware/auth.js\n// module id = 11\n// module chunks = 3\n\n//# sourceURL=webpack:///./src/middleware/auth.js?");

/***/ },

/***/ 31:
/***/ function(module, exports) {

eval("module.exports = require(\"js-cookie\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"js-cookie\"\n// module id = 31\n// module chunks = 3\n\n//# sourceURL=webpack:///external_%22js-cookie%22?");

/***/ },

/***/ 4:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony export */ exports[\"loginPost\"] = loginPost;/* harmony export */ exports[\"configureAuth\"] = configureAuth;/* harmony export */ exports[\"loginSuccess\"] = loginSuccess;/* harmony export */ exports[\"loginError\"] = loginError;/* harmony export */ exports[\"logoutRequest\"] = logoutRequest;/* harmony export */ exports[\"logoutSuccess\"] = logoutSuccess;/* harmony export */ exports[\"logoutError\"] = logoutError;/**\n * @module authActionCreators\n */\n\n/**\n * Create a 'POST' action with onSuccess that parses the API response and\n * returns either a loginError action (API successfully returned, but the\n * response indicates login failure) or a loginSuccess action. onError always\n * returns a loginError action\n * @param {Object} params object with 'email' and 'password' props\n */\nfunction loginPost(params) {\n\tvar LOGIN_REF = 'login';\n\treturn {\n\t\ttype: 'LOGIN_POST',\n\t\tpayload: {\n\t\t\tquery: {\n\t\t\t\ttype: 'login',\n\t\t\t\tparams: params,\n\t\t\t\tref: LOGIN_REF\n\t\t\t},\n\t\t\tonSuccess: function onSuccess(_ref) {\n\t\t\t\tvar queries = _ref.queries;\n\t\t\t\tvar responses = _ref.responses;\n\n\t\t\t\t// get the response `value`\n\t\t\t\tvar response = responses.slice()[0][LOGIN_REF];\n\t\t\t\t// check for errors reported by API (will be handled by loginError)\n\n\t\t\t\tif (response.value.errors) {\n\t\t\t\t\treturn loginError(response.value.errors);\n\t\t\t\t}\n\t\t\t\t// otherwise return the action\n\t\t\t\treturn loginSuccess(response);\n\t\t\t},\n\t\t\tonError: loginError\n\t\t}\n\t};\n}\n\nfunction configureAuth(auth, isServer) {\n\treturn {\n\t\ttype: 'CONFIGURE_AUTH',\n\t\tpayload: auth,\n\t\tmeta: isServer\n\t};\n}\n\nfunction loginSuccess(response) {\n\treturn {\n\t\ttype: 'LOGIN_SUCCESS',\n\t\tpayload: response\n\t};\n}\n\nfunction loginError(response) {\n\treturn {\n\t\ttype: 'LOGIN_ERROR',\n\t\tpayload: response\n\t};\n}\n\nfunction logoutRequest() {\n\treturn {\n\t\ttype: 'LOGOUT_REQUEST'\n\t};\n}\n\nfunction logoutSuccess(auth) {\n\treturn {\n\t\ttype: 'LOGOUT_SUCCESS',\n\t\tpayload: auth\n\t};\n}\n\nfunction logoutError() {\n\treturn {\n\t\ttype: 'LOGOUT_ERROR'\n\t};\n}\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/actions/authActionCreators.js\n// module id = 4\n// module chunks = 3 10\n\n//# sourceURL=webpack:///./src/actions/authActionCreators.js?");

/***/ },

/***/ 40:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(11);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi middleware/auth\n// module id = 40\n// module chunks = 3\n\n//# sourceURL=webpack:///multi_middleware/auth?");

/***/ }

/******/ })
});
;