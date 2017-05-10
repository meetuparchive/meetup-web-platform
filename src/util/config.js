import fs from 'fs';
import convict from 'convict';
import path from 'path';

import { duotones, getDuotoneUrls } from './duotone';

/**
 * This module provides a single source of truth for application configuration
 * info. It uses node-convict to read configuration info from, in increasing
 * order of precedence:
 *
 * 1. Default value
 * 2. File (`config.loadFile()`) - app root `config.<NODE_ENV>.json`
 * 3. Environment variables
 * 4. Command line arguments
 * 5. Set and load calls (config.set() and config.load())
 *
 * Note that environment variables have _higher_ precedence than values in
 * config files, so the config files will only work if environment variables
 * are cleared.
 *
 * The only values that _must_ be in environment variables are the secrets that
 * are used to interact with external systems:
 *
 * - `MUPWEB_OAUTH_SECRET`
 * - `MUPWEB_OAUTH_KEY`
 * - `PHOTO_SCALER_SALT`
 *
 * @module config
 */

const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';

export const PROTOCOL_ERROR = 'Protocol must be http or https';
export const COOKIE_SECRET_ERROR =
	'Cookie Encrypt Secret must be a random 32+ char string';
export const CSRF_SECRET_ERROR = 'CSRF Secret must be a random 32+ char string';
export const OAUTH_SECRET_ERROR = 'Invalid OAUTH Secret';
export const OAUTH_KEY_ERROR = 'Invalid OAUTH Key';
export const SALT_ERROR = 'Invalid Photo Scaler Salt';

export const validateProtocol = protocol => {
	if (!['http', 'https'].includes(protocol)) {
		throw new Error(PROTOCOL_ERROR);
	}
};

export const validateCookieSecret = secret => {
	if (!secret || secret.toString().length < 32) {
		throw new Error(COOKIE_SECRET_ERROR);
	}
};

export const validateCsrfSecret = secret => {
	if (!secret || secret.toString().length < 32) {
		throw new Error(CSRF_SECRET_ERROR);
	}
};

export const validateOauthSecret = secret => {
	if (!secret || secret.toString().length < 1) {
		throw new Error(OAUTH_SECRET_ERROR);
	}
};

export const validateOauthKey = key => {
	if (!key || key.toString().length < 1) {
		throw new Error(OAUTH_KEY_ERROR);
	}
};

export const validatePhotoScalerSalt = salt => {
	if (!salt || salt.toString().length < 1) {
		throw new Error(SALT_ERROR);
	}
};

let config = convict({
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
	},
	api: {
		protocol: {
			format: validateProtocol,
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
		root_url: {
			format: String,
			default: '',
		},
	},
	asset_server: {
		host: {
			format: String,
			default: 'beta2.dev.meetup.com',
			env: 'ASSET_SERVER_HOST',
		},
		path: {
			format: String,
			default: '/static',
			env: 'ASSET_PATH',
		},
		port: {
			format: 'port',
			default: 8001,
			arg: 'asset-port',
			env: 'ASSET_SERVER_PORT',
		},
	},
	disable_hmr: {
		format: Boolean,
		default: false,
		env: 'DISABLE_HMR',
	},
	cookie_encrypt_secret: {
		format: validateCookieSecret,
		default: process.env.NODE_ENV !== 'production' && random32,
		env: 'COOKIE_ENCRYPT_SECRET',
	},
	csrf_secret: {
		format: validateCsrfSecret,
		default: process.env.NODE_ENV !== 'production' && random32,
		env: 'CSRF_SECRET',
	},
	app_server: {
		protocol: {
			format: validateProtocol,
			default: 'http',
			env: 'DEV_SERVER_PROTOCOL', // legacy naming
		},
		host: {
			format: String,
			default: 'beta2.dev.meetup.com',
			env: 'DEV_SERVER_HOST', // legacy naming
		},
		port: {
			format: 'port',
			default: 8000,
			arg: 'app-port',
			env: 'DEV_SERVER_PORT', // legacy naming
		},
	},
	duotone_urls: {
		format: Object,
		default: {},
	},
	isDev: {
		format: Boolean,
		default: true,
	},
	isProd: {
		format: Boolean,
		default: false,
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
			format: validateOauthSecret,
			default: null,
			env: 'MUPWEB_OAUTH_SECRET',
		},
		key: {
			format: validateOauthKey,
			default: null,
			env: 'MUPWEB_OAUTH_KEY',
		},
	},
	photo_scaler_salt: {
		format: validatePhotoScalerSalt,
		default: null,
		env: 'PHOTO_SCALER_SALT',
	},
});

// Load environment dependent configuration
const configFile = path.resolve(
	process.cwd(),
	`config.${config.get('env')}.json`
);

if (fs.existsSync(configFile)) {
	config.loadFile(configFile);
}

config.set(
	'duotone_urls',
	getDuotoneUrls(duotones, config.get('photo_scaler_salt'))
);

config.set(
	'api.root_url',
	`${config.get('api.protocol')}://${config.get('api.host')}`
);

config.set('isProd', config.get('env') === 'production');
config.set('isDev', config.get('env') === 'development');
config.validate();
process.stdout.write(JSON.stringify(config.getProperties(), null, 2));

export default config.getProperties();
