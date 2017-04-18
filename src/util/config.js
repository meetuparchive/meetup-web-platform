import fs from 'fs';
import convict from 'convict';

import {
	duotones,
	getDuotoneUrls
} from './duotone';

/**
 * @module config
 */

const oauthError = new Error('get oauth secrets from #web-platform team');

let config = convict({
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV'
	},
	api: {
		protocol: {
			format: function(protocol) {
				if (!['http', 'https'].includes(protocol)) {
					throw new Error('must be http or https');
				}
			},
			default: 'https'
		},
		host: {
			format: String,
			default: 'api.meetup.com'
		},
		timeout: {
			format: 'int',
			default: 8000
		}
	},
	asset_server: {
		host: {
			format: String,
			default: '0.0.0.0'
		},
		port: {
			format: 'port',
			default: 8001
		}
	},
	cookie_encrypt_secret: {
		format: function (secret) {
			if (secret.toString().length < 32) {
				throw new Error('set COOKIE_ENCRYPT_SECRET env variable to a random 32+ character string');
			}
		},
		default: ''
	},
	csrf_secret: {
		format: function (secret) {
			if (secret.toString().length < 32) {
				throw new Error('set CSRF_SECRET env variable to a random 32+ character string');
			}
		},
		default: ''
	},
	dev_server: {
		host: {
			format: String,
			default: '0.0.0.0'
		},
		port: {
			format: 'port',
			default: 8000
		}
	},
	oauth: {
		auth_url: {
			format: 'url',
			default: 'https://secure.meetup.com/oauth2/authorize'
		},
		access_url: {
			format: 'url',
			default: 'https://secure.meetup.com/oauth2/access'
		},
		secret: {
			format: function (secret) {
				if (secret.toString().length < 1) {
					throw oauthError;
				}
			},
			default: ''
		},
		key: {
			format: function (key) {
				if (key.toString().length < 1) {
					throw oauthError;
				}
			},
			default: ''
		}
	},
	photo_scaler_salt: {
		format: function (salt) {
			if (salt.toString().length < 1) {
				throw new Error('get PHOTO_SCALER_SALT from #web-platform team');
			}
		},
		default: ''
	}
});


// Optionally override these properties with a JSON file
const env = config.get('env');
const configFile = `./config.${env}.json`;
if (fs.existsSync(configFile)) {
	config.loadFile(configFile);
}

// Load environment dependent configuration

config.set(
	'duotone_urls',
	getDuotoneUrls(
		duotones,
		config.get('photo_scaler_salt')
	)
);

config.set(
	'api_server_root_url',
	`${config.get('api.protocol')}://${config.get('api.host')}`
);

config.set(
	'isProd',
	config.get('env') === 'production'
);

config.set(
	'isDev',
	config.get('env') === 'development'
);

config.validate();

export default config;
