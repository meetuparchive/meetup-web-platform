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
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(5);


/***/ },

/***/ 5:
/***/ function(module, exports) {

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	import https from 'https';
	import Hapi from 'hapi';

	import './globals';

	import getConfig from './util/config';
	import getPlugins from './plugins';
	import getRoutes from './routes';

	/**
	 * @module server
	 */

	/**
	 * determine whether a nested object of values contains a string that contains
	 * `.dev.meetup.`
	 * @param {String|Object} value string or nested object with
	 * values that could be URL strings
	 * @return {Boolean} whether the `value` contains a 'dev' URL string
	 */
	export function checkForDevUrl(value) {
		switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
			case 'string':
				return value.indexOf('.dev.meetup.') > -1;
			case 'object':
				return Object.keys(value).some(function (key) {
					return checkForDevUrl(value[key]);
				});
		}
		return false;
	}

	/**
	 * Make any environment changes that need to be made in response to the provided
	 * config
	 * @param {Object} config
	 * @return {Object} the original config object
	 */
	export function configureEnv(config) {
		// When using .dev.meetup endpoints, ignore self-signed SSL cert
		var USING_DEV_ENDPOINTS = checkForDevUrl(config);
		https.globalAgent.options.rejectUnauthorized = !USING_DEV_ENDPOINTS;

		return config;
	}

	/**
	 * server-starting function
	 */
	export function server(routes, connection) {
		var plugins = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

		var server = new Hapi.Server();

		return server.connection(connection).register(plugins).then(function () {
			return server.log(['start'], plugins.length + ' plugins registered, assigning routes...');
		}).then(function () {
			return server.route(routes);
		}).then(function () {
			return server.log(['start'], routes.length + ' routes assigned, starting server...');
		}).then(function () {
			return server.start();
		}).then(function () {
			return server.log(['start'], 'Dev server is listening at ' + server.info.uri);
		});
	}

	/**
	 * The start function applies the rendering function to the correct application
	 * route and combines the provided routes and plugins with the base routes
	 * and plugins
	 *
	 * @param {Object} renderRequestMap A mapping of localeCodes to functions that emit
	 *   the rendered HTML for the locale-specific request
	 * @param {Array} routes additional routes for the app - cannot include a
	 *   wildcard route
	 * @param {Array} plugins additional plugins for the server, usually to support
	 *   features in the additional routes
	 * @return {Promise} the Promise returned by Hapi's `server.connection` method
	 */
	export default function start(renderRequestMap) {
		var routes = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
		var plugins = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

		// source maps make for better stack traces - we might not want this in
		// production if it makes anything slower, though
		// (process.env.NODE_ENV === 'production')
		require('source-map-support').install();

		return getConfig().then(configureEnv).then(function (config) {
			var baseRoutes = getRoutes(renderRequestMap, config);
			var finalRoutes = [].concat(_toConsumableArray(routes), _toConsumableArray(baseRoutes));

			var connection = {
				host: '0.0.0.0',
				port: config.DEV_SERVER_PORT
			};

			var finalPlugins = [].concat(_toConsumableArray(plugins), _toConsumableArray(getPlugins(config)));

			return server(finalRoutes, connection, finalPlugins);
		});
	}

/***/ }

/******/ });