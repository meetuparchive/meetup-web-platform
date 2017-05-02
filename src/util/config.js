import fs from 'fs';
import convict from 'convict';
import path from 'path';

import { duotones, getDuotoneUrls } from './duotone';

/**
 * @module config
 */

const oauthError = new Error('get oauth secrets from #web-platform team');

let config = convict({
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
	},
	api: {
		protocol: {
			format: function(protocol) {
				if (!['http', 'https'].includes(protocol)) {
					throw new Error('must be http or https');
				}
			},
			default: 'https',
			env: 'API_PROTOCOL',
		},
		host: {
			format: String,
			default: 'api.dev.meetup.com',
			env: 'API_HOST',
		},
		timeout: {
			format: 'int',
			default: 8000,
			env: 'API_TIMEOUT',
		},
	},
	asset_server: {
		host: {
			format: String,
			default: '0.0.0.0',
			env: 'ASSET_SERVER_HOST',
		},
		port: {
			format: 'port',
			default: 8001,
			env: 'ASSET_SERVER_PORT',
		},
	},
	cookie_encrypt_secret: {
		format: function(secret) {
			if (!secret || secret.toString().length < 32) {
				throw new Error(
					'set COOKIE_ENCRYPT_SECRET env variable to a random 32+ character string'
				);
			}
		},
		default: null,
		env: 'COOKIE_ENCRYPT_SECRET',
	},
	csrf_secret: {
		format: function(secret) {
			if (!secret || secret.toString().length < 32) {
				throw new Error(
					'set CSRF_SECRET env variable to a random 32+ character string'
				);
			}
		},
		default: null,
		env: 'CSRF_SECRET',
	},
	dev_server: {
		host: {
			format: String,
			default: '0.0.0.0',
			env: 'DEV_SERVER_HOST',
		},
		port: {
			format: 'port',
			default: 8000,
			env: 'DEV_SERVER_PORT',
		},
	},
	oauth: {
		auth_url: {
			format: 'url',
			default: 'https://secure.dev.meetup.com/oauth2/authorize',
			env: 'OAUTH_AUTH_URL',
		},
		access_url: {
			format: 'url',
			default: 'https://secure.dev.meetup.com/oauth2/access',
			env: 'OAUTH_ACCESS_URL',
		},
		secret: {
			format: function(secret) {
				if (!secret || secret.toString().length < 1) {
					throw oauthError;
				}
			},
			default: null,
			env: 'MUPWEB_OAUTH_SECRET',
		},
		key: {
			format: function(key) {
				if (key.toString().length < 1) {
					throw oauthError;
				}
			},
			default: null,
			env: 'MUPWEB_OAUTH_KEY',
		},
	},
	photo_scaler_salt: {
		format: function(salt) {
			if (salt.toString().length < 1) {
				throw new Error('get PHOTO_SCALER_SALT from #web-platform team');
			}
		},
		default: null,
		env: 'PHOTO_SCALER_SALT',
	},
});

// Load environment dependent configuration
const configFile = path.resolve(
	__dirname,
	`../config.${config.get('env')}.json`
);
if (fs.existsSync(configFile)) {
	config.loadFile(configFile);
}

config.set(
	'duotone_urls',
	getDuotoneUrls(duotones, config.get('photo_scaler_salt'))
);

config.set(
	'api_server_root_url',
	`${config.get('api.protocol')}://${config.get('api.host')}`
);

config.set('isProd', config.get('env') === 'production');

config.set('isDev', config.get('env') === 'development');

config.validate();

export default config.getProperties();
