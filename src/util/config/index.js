import fs from 'fs';
import convict from 'convict';
import path from 'path';

import buildConfig, { schema as buildSchema, validateProtocol } from './build';
import { duotones, getDuotoneUrls } from '../duotone';

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
const secretDefault = (process.env.NODE_ENV !== 'production' && random32) || ''; // no prod default

export const COOKIE_SECRET_ERROR =
	'Cookie Encrypt Secret must be a random 32+ char string';
export const CSRF_SECRET_ERROR = 'CSRF Secret must be a random 32+ char string';
export const OAUTH_SECRET_ERROR = 'Invalid OAUTH Secret';
export const OAUTH_KEY_ERROR = 'Invalid OAUTH Key';
export const SALT_ERROR = 'Invalid Photo Scaler Salt';

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

export const config = convict({
	...buildSchema,
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
	duotone_urls: {
		format: Object,
		default: {},
	},
	cookie_encrypt_secret: {
		format: validateCookieSecret,
		default: secretDefault,
		env: 'COOKIE_ENCRYPT_SECRET',
		sensitive: true,
	},
	csrf_secret: {
		format: validateCsrfSecret,
		default: secretDefault,
		env: 'CSRF_SECRET',
		sensitive: true,
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
			sensitive: true,
		},
		key: {
			format: validateOauthKey,
			default: null,
			env: 'MUPWEB_OAUTH_KEY',
			sensitive: true,
		},
	},
	photo_scaler_salt: {
		format: validatePhotoScalerSalt,
		default: null,
		env: 'PHOTO_SCALER_SALT',
		sensitive: true,
	},
});

config.load(buildConfig);

// Load environment dependent configuration
const configPath = path.resolve(
	process.cwd(),
	`config.${config.get('env')}.json`
);

const localConfig = fs.existsSync(configPath) ? require(configPath) : {};
config.load(localConfig);

config.set(
	'api.root_url',
	`${config.get('api.protocol')}://${config.get('api.host')}`
);

config.set(
	'duotone_urls',
	getDuotoneUrls(duotones, config.get('photo_scaler_salt'))
);

config.set('isProd', config.get('env') === 'production');
config.set('isDev', config.get('env') === 'development');
config.validate();

export default config.getProperties();
