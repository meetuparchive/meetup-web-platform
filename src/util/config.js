import convict from 'convict';
import {
	duotones,
	getDuotoneUrls
} from './duotone';
/**
 * Start the server with a config
 *
 * This module provides a Promise-based interface for assembling a
 * configuration object and passing it to the server startup function.
 * @module config
 */

export default function getConfig(overrideConfig = {}) {
	/**
	 * Read all config from environment variables here once on startup
	 */
	if (!process.env.OAUTH_ACCESS_URL && process.env.ANONYMOUS_ACCESS_URL) {
		console.error('The ANONYMOUS_ACCESS_URL env variable is no longer supported - please rename to OAUTH_ACCESS_URL');
	}
	if (!process.env.OAUTH_AUTH_URL && process.env.ANONYMOUS_AUTH_URL) {
		console.error('The ANONYMOUS_AUTH_URL env variable is no longer supported - please rename to OAUTH_AUTH_URL');
	}
	const oauthError = new Error('get oauth secrets from #web-platform team');

	const config = convict({
		API_PROTOCOL: {
			env: 'API_PROTOCOL',
			default: 'https',
			format: function(protocol) {
				if (!['http', 'https'].includes(protocol)) {
					throw new Error('must be http or https');
				}
			}
		},
		API_HOST: {
			env: 'API_HOST',
			default: 'api.dev.meetup.com',
			format: String
		},
		API_TIMEOUT: {
			env: 'API_TIMEOUT',
			default: 8000,
			format: 'int'
		},
		COOKIE_ENCRYPT_SECRET: {
			env: 'COOKIE_ENCRYPT_SECRET',
			default: null,
			format: function (secret) {
				if (secret.toString().length < 32) {
					throw new Error('set COOKIE_ENCRYPT_SECRET env variable to a random 32+ character string')
				}
			}
		},
		CSRF_SECRET: {
			env: 'CSRF_SECRET',
			default: null,
			format: function (secret) {
				if (secret.toString().length < 32) {
					throw new Error('set CSRF_SECRET env variable to a random 32+ character string')
				}
			}
		},
		DEV_SERVER_PORT: {
			env: 'DEV_SERVER_PORT',
			default: 8000,
			format: 'port'
		},
		OAUTH_AUTH_URL: {
			env: 'OAUTH_AUTH_URL',
			default: 'https://secure.dev.meetup.com/oauth2/authorize',
			format: 'url'
		},
		OAUTH_ACCESS_URL: {
			env: 'OAUTH_ACCESS_URL',
			default: 'https://secure.dev.meetup.com/oauth2/access',
			format: 'url'
		},
		PHOTO_SCALER_SALT: {
			env: 'PHOTO_SCALER_SALT',
			default: null,
			format: function (salt) {
				if (salt.toString().length < 1) {
					throw new Error('get PHOTO_SCALER_SALT from #web-platform team');
				}
			}
		},
		oauth: {
			secret: {
				env: 'MUPWEB_OAUTH_SECRET',
				default: null,
				format: function (secret) {
					if (secret.toString().length < 1) {
						throw oauthError;
					}
				}
			},
			key: {
				env: 'MUPWEB_OAUTH_KEY',
				default: null,
				format: function (key) {
					if (key.toString().length < 1) {
						throw oauthError;
					}
				}
			}
		}
	});

	config.load(overrideConfig);

	config.set('duotoneUrls', getDuotoneUrls(duotones, config.get('PHOTO_SCALER_SALT')));
	config.set('API_SERVER_ROOT_URL', `${config.get('API_PROTOCOL')}://${config.get('API_HOST')}`);

	config.validate();

	return Promise.resolve({...config.getProperties(), ...overrideConfig});
}