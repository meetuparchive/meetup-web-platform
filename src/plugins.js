import Good from 'good';
import anonAuthPlugin from './anonAuthPlugin';

/**
 * Hapi plugins for the dev server
 *
 * @module ServerPlugins
 */

/**
 * Provides Hapi process monitoring and console logging
 *
 * @see {@link https://github.com/hapijs/good}
 */
export function getConsoleLogPlugin() {
	return {
		register: Good,
		options: {
			ops: false,  // no ops reporting (for now)
			reporters: {
				console: [
					{  // filter events with good-squeeze
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [{
							error: '*',
							response: '*',
							request: '*',
							log: '*',
						}]
					}, {  // format with good-console
						module: 'good-console',
						args: [{
							format: 'YYYY-MM-DD HH:mm:ss.SSS',
						}]
					},
					'stdout'  // pipe to stdout
				]
			}
		}
	};
}

/**
 * configure and return the plugin that will allow requests to get anonymous
 * oauth tokens to communicate with the API
 */
export function getAnonAuthPlugin(options) {
	return {
		register: anonAuthPlugin,
		options,
	};
}

export default function getPlugins(config) {
	return [
		getConsoleLogPlugin(),
		getAnonAuthPlugin(config),
	];
}

