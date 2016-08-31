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
/******/ 	return __webpack_require__(__webpack_require__.s = 42);
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ function(module, exports) {

eval("module.exports = require(\"redux\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"redux\"\n// module id = 1\n// module chunks = 0 1 3 4 5\n\n//# sourceURL=webpack:///external_%22redux%22?");

/***/ },

/***/ 15:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar _redux = __webpack_require__(1);\n\nvar _fetchUtils = __webpack_require__(8);\n\n/**\n * PostMiddleware provides a generic interface for triggering POST requests and\n * dispatching particular actions with the API response. The POST action must\n * follow this structure:\n *\n * ```\n * {\n *   type: 'POST',\n *   onSuccess: a callback that takes the API response as an argument, and\n *     returns an action object. The middleware takes care of dispatch\n *   onError: a callback that takes an Error argument and returns an action\n *     object\n * }\n * ```\n *\n * This structure usually allows the success/error handling code to be bundled\n * alongside the POST action creator, with the expectation that all response\n * processing can be done there\n *\n * @module PostMiddleware\n */\nvar PostMiddleware = function PostMiddleware(store) {\n  return function (next) {\n    return function (action) {\n      var type = action.type;\n      var payload = action.payload;\n\n      if (type.endsWith('_POST') || type.startsWith('POST_')) {\n        var query = payload.query;\n        var onSuccess = payload.onSuccess;\n        var onError = payload.onError;\n\n        var actions = (0, _redux.bindActionCreators)({\n          onSuccess: onSuccess,\n          onError: onError\n        }, store.dispatch);\n\n        var _store$getState = store.getState();\n\n        var config = _store$getState.config;\n        var auth = _store$getState.auth;\n\n\n        (0, _fetchUtils.fetchQueries)(config.apiUrl, { method: 'POST', auth: auth })([query]).then(actions.onSuccess).catch(actions.onError);\n      }\n      return next(action);\n    };\n  };\n};\n\nexports.default = PostMiddleware;\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/middleware/post.js\n// module id = 15\n// module chunks = 5\n\n//# sourceURL=webpack:///./src/middleware/post.js?");

/***/ },

/***/ 42:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(15);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi middleware/post\n// module id = 42\n// module chunks = 5\n\n//# sourceURL=webpack:///multi_middleware/post?");

/***/ },

/***/ 8:
/***/ function(module, exports) {

"use strict";
eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n\tvalue: true\n});\n/**\n * A module for middleware that would like to make external calls through `fetch`\n * @module fetchUtils\n */\n\n/**\n * Wrapper around `fetch` to send an array of queries to the server. It ensures\n * that the request will have the required Oauth access token and constructs\n * the `fetch` call arguments based on the request method\n * @param {String} apiUrl the general-purpose endpoint for API calls to the\n *   application server\n * @param {Object} options {\n *     method: \"get\", \"post\", \"delete\", or \"patch\",\n *     auth: { oauth_token },\n *   }\n * @return {Promise} resolves with a `{queries, responses}` object\n */\nvar fetchQueries = exports.fetchQueries = function fetchQueries(apiUrl, options) {\n\treturn function (queries) {\n\t\toptions.method = options.method || 'GET';\n\t\tvar auth = options.auth;\n\t\tvar method = options.method;\n\n\n\t\tif (!auth.oauth_token) {\n\t\t\tconsole.log('No access token provided - hope there\\'s a refresh token');\n\t\t}\n\t\tvar isPost = method.toLowerCase() === 'post';\n\n\t\tvar params = new URLSearchParams();\n\t\tparams.append('queries', JSON.stringify(queries));\n\t\tvar fetchUrl = apiUrl + '?' + (isPost ? '' : params);\n\t\tvar fetchConfig = {\n\t\t\tmethod: method,\n\t\t\theaders: {\n\t\t\t\tAuthorization: 'Bearer ' + auth.oauth_token,\n\t\t\t\t'content-type': isPost ? 'application/x-www-form-urlencoded' : 'text/plain'\n\t\t\t}\n\t\t};\n\t\tif (isPost) {\n\t\t\tfetchConfig.body = params;\n\t\t}\n\t\treturn fetch(fetchUrl, fetchConfig).then(function (queryResponse) {\n\t\t\treturn queryResponse.json();\n\t\t}).then(function (responses) {\n\t\t\treturn { queries: queries, responses: responses };\n\t\t});\n\t};\n};\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/util/fetchUtils.js\n// module id = 8\n// module chunks = 1 5\n\n//# sourceURL=webpack:///./src/util/fetchUtils.js?");

/***/ }

/******/ });