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

eval("module.exports = require(\"redux\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"redux\"\n// module id = 1\n// module chunks = 0 1 3 4 5\n\n//# sourceURL=webpack:///external_%22redux%22?");

/***/ },

/***/ 11:
/***/ function(module, exports) {

eval("module.exports = require(\"js-cookie\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"js-cookie\"\n// module id = 11\n// module chunks = 0 3\n\n//# sourceURL=webpack:///external_%22js-cookie%22?");

/***/ },

/***/ 2:
/***/ function(module, exports) {

"use strict";
eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n\tvalue: true\n});\nexports.loginPost = loginPost;\nexports.configureAuth = configureAuth;\nexports.loginSuccess = loginSuccess;\nexports.loginError = loginError;\nexports.logoutRequest = logoutRequest;\nexports.logoutSuccess = logoutSuccess;\nexports.logoutError = logoutError;\n/**\n * @module authActionCreators\n */\n\n/**\n * Create a 'POST' action with onSuccess that parses the API response and\n * returns either a loginError action (API successfully returned, but the\n * response indicates login failure) or a loginSuccess action. onError always\n * returns a loginError action\n * @param {Object} params object with 'email' and 'password' props\n */\nfunction loginPost(params) {\n\tvar LOGIN_REF = 'login';\n\treturn {\n\t\ttype: 'LOGIN_POST',\n\t\tpayload: {\n\t\t\tquery: {\n\t\t\t\ttype: 'login',\n\t\t\t\tparams: params,\n\t\t\t\tref: LOGIN_REF\n\t\t\t},\n\t\t\tonSuccess: function onSuccess(_ref) {\n\t\t\t\tvar queries = _ref.queries;\n\t\t\t\tvar responses = _ref.responses;\n\n\t\t\t\t// get the response `value`\n\t\t\t\tvar response = responses.slice()[0][LOGIN_REF];\n\t\t\t\t// check for errors reported by API (will be handled by loginError)\n\n\t\t\t\tif (response.value.errors) {\n\t\t\t\t\treturn loginError(response.value.errors);\n\t\t\t\t}\n\t\t\t\t// otherwise return the action\n\t\t\t\treturn loginSuccess(response);\n\t\t\t},\n\t\t\tonError: loginError\n\t\t}\n\t};\n}\n\nfunction configureAuth(auth, isServer) {\n\treturn {\n\t\ttype: 'CONFIGURE_AUTH',\n\t\tpayload: auth,\n\t\tmeta: isServer\n\t};\n}\n\nfunction loginSuccess(response) {\n\treturn {\n\t\ttype: 'LOGIN_SUCCESS',\n\t\tpayload: response\n\t};\n}\n\nfunction loginError(response) {\n\treturn {\n\t\ttype: 'LOGIN_ERROR',\n\t\tpayload: response\n\t};\n}\n\nfunction logoutRequest() {\n\treturn {\n\t\ttype: 'LOGOUT_REQUEST'\n\t};\n}\n\nfunction logoutSuccess(auth) {\n\treturn {\n\t\ttype: 'LOGOUT_SUCCESS',\n\t\tpayload: auth\n\t};\n}\n\nfunction logoutError() {\n\treturn {\n\t\ttype: 'LOGOUT_ERROR'\n\t};\n}\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/actions/authActionCreators.js\n// module id = 2\n// module chunks = 0 3 10\n\n//# sourceURL=webpack:///./src/actions/authActionCreators.js?");

/***/ },

/***/ 40:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(6);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi middleware/auth\n// module id = 40\n// module chunks = 3\n\n//# sourceURL=webpack:///multi_middleware/auth?");

/***/ },

/***/ 6:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n\tvalue: true\n});\nexports.ANONYMOUS_AUTH_APP_PATH = undefined;\n\nvar _jsCookie = __webpack_require__(11);\n\nvar _jsCookie2 = _interopRequireDefault(_jsCookie);\n\nvar _rx = __webpack_require__(0);\n\nvar _rx2 = _interopRequireDefault(_rx);\n\nvar _redux = __webpack_require__(1);\n\nvar _authActionCreators = __webpack_require__(2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\n/**\n * Auth middle handles all the server communication and cookie managmenet\n * related to login actions.\n *\n * We assume that the login API provides *both* an auth token and the member\n * object corresponding to the login credentials\n *\n * @module AuthMiddleware\n */\nvar ANONYMOUS_AUTH_APP_PATH = exports.ANONYMOUS_AUTH_APP_PATH = '/anon';\n\n/**\n * login sub responds to only the most recent login request, and can be disposed\n * by a logout\n * @const\n */\nvar loginSub = new _rx2.default.SerialDisposable();\nloginSub.setDisposable(_rx2.default.Disposable.empty);\n\n/**\n * There are 6 login-related actions:\n *\n * 1. 'LOGIN_REQUEST' - send credentials for login\n * 2. 'LOGIN_SUCCESS' - updates local state/cookie from api response\n * 3. 'LOGIN_ERROR' - server failed to login user with supplied credentials\n * 4. 'LOGOUT_REQUEST' - return to default state and request anonymous\n *   auth token from server\n * 5. 'LOGOUT_SUCCESS' - new anonymous auth token returned\n * 6. 'LOGOUT_ERROR' - server failed to get anonymous auth token - fatal\n */\nvar AuthMiddleware = function AuthMiddleware(store) {\n\treturn function (next) {\n\t\treturn function (action) {\n\t\t\tvar actions = (0, _redux.bindActionCreators)({\n\t\t\t\tlogoutSuccess: _authActionCreators.logoutSuccess,\n\t\t\t\tlogoutError: _authActionCreators.logoutError,\n\t\t\t\tconfigureAuth: _authActionCreators.configureAuth\n\t\t\t}, store.dispatch);\n\t\t\tvar response = void 0;\n\t\t\tswitch (action.type) {\n\t\t\t\tcase 'LOGIN_SUCCESS':\n\t\t\t\t\t// parse the login API endpoint response and dispatch\n\t\t\t\t\t// configure auth action\n\t\t\t\t\tresponse = action.payload;\n\t\t\t\t\tactions.configureAuth({\n\t\t\t\t\t\toauth_token: response.value.oauth_token, // currently does not expire\n\t\t\t\t\t\texpires_in: response.value.expires_in || 60 * 60, // seconds\n\t\t\t\t\t\trefresh_token: response.value.refresh_token,\n\t\t\t\t\t\tanonymous: false\n\t\t\t\t\t});\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGIN_ERROR':\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGOUT_REQUEST':\n\t\t\t\t\t// immediately clear auth information so no more private data is accessible\n\t\t\t\t\t// - this will put the app in limbo, unable to request any more data until\n\t\t\t\t\t// a new token is provided by `LOGOUT_SUCESS` or a full refresh\n\t\t\t\t\tactions.configureAuth({\n\t\t\t\t\t\tanonymous: true\n\t\t\t\t\t});\n\t\t\t\t\t// Go get a new anonymous oauth token\n\t\t\t\t\tfetch(ANONYMOUS_AUTH_APP_PATH).then(function (response) {\n\t\t\t\t\t\treturn response.json();\n\t\t\t\t\t}).catch(function (e) {\n\t\t\t\t\t\treturn Promise.reject([e]);\n\t\t\t\t\t}).then(actions.logoutSuccess, actions.logoutError);\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGOUT_SUCCESS':\n\t\t\t\t\t// anonymous auth has returned new anon oauth token\n\t\t\t\t\tresponse = action.payload;\n\t\t\t\t\t// re-sync the page\n\t\t\t\t\tactions.configureAuth({\n\t\t\t\t\t\tanonymous: true,\n\t\t\t\t\t\toauth_token: response.access_token,\n\t\t\t\t\t\trefresh_token: response.refresh_token,\n\t\t\t\t\t\texpires_in: response.expires_in\n\t\t\t\t\t});\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'LOGOUT_ERROR':\n\t\t\t\t\tbreak;\n\t\t\t\tcase 'CONFIGURE_AUTH':\n\t\t\t\t\t// The middleware sets cookies based on `configureAuth` actions, but only\n\t\t\t\t\t// in the browser. `action.meta` is a Boolean indicating whether the\n\t\t\t\t\t// action was dispatched from the server or the browser. If it's from the\n\t\t\t\t\t// server, we should not set cookies\n\t\t\t\t\tif (!action.meta) {\n\t\t\t\t\t\tvar _action$payload = action.payload;\n\t\t\t\t\t\tvar oauth_token = _action$payload.oauth_token;\n\t\t\t\t\t\tvar expires_in = _action$payload.expires_in;\n\t\t\t\t\t\tvar refresh_token = _action$payload.refresh_token;\n\t\t\t\t\t\tvar anonymous = _action$payload.anonymous;\n\n\t\t\t\t\t\tvar expires = expires_in ? 1 / 24 / 3600 * expires_in : 365; // lifetime in *days*\n\n\t\t\t\t\t\t_jsCookie2.default.set('oauth_token', oauth_token || '', { expires: expires });\n\t\t\t\t\t\t_jsCookie2.default.set('refresh_token', refresh_token || '', { expires: 5 * 365 } // 5 year expiration - 'permanent'\n\t\t\t\t\t\t);\n\t\t\t\t\t\t_jsCookie2.default.set('anonymous', anonymous || '', { expires: 5 * 365 } // 'permanent', but refreshes with every login/logout\n\t\t\t\t\t\t);\n\t\t\t\t\t}\n\t\t\t\t\tbreak;\n\t\t\t}\n\n\t\t\treturn next(action);\n\t\t};\n\t};\n};\n\nexports.default = AuthMiddleware;\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/middleware/auth.js\n// module id = 6\n// module chunks = 0 3\n\n//# sourceURL=webpack:///./src/middleware/auth.js?");

/***/ }

/******/ });