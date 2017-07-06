import fs from 'fs';
import os from 'os';
import path from 'path';

import chalk from 'chalk';
import convict from 'convict';

import buildConfig, { schema as buildSchema } from './build';
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

export const CSRF_SECRET_ERROR = 'CSRF Secret must be a random 32+ char string';
export const OAUTH_SECRET_ERROR = 'Invalid OAUTH Secret';
export const OAUTH_KEY_ERROR = 'Invalid OAUTH Key';
export const COOKIE_SECRET_ERROR =
	'Cookie Secret must be a random 32+ char string';
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

export const PROTOCOL_ERROR = 'Protocol must be http or https';

export const validateProtocol = protocol => {
	if (!['http', 'https'].includes(protocol)) {
		throw new Error(PROTOCOL_ERROR);
	}
};

const DEV_SUBSTRING = '.dev.';
export const validateServerHost = host => {
	if (typeof host !== 'string') {
		throw new Error('Server host property must be a string');
	}
	const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
	if (process.env.NODE_ENV === 'production' && host.includes(DEV_SUBSTRING)) {
		throw new Error(
			`Server host ${host} must not include '.dev.' in production`
		);
	}
	if (isDev && !host.includes(DEV_SUBSTRING)) {
		throw new Error(`Server host ${host} must include '.dev.' in development`);
	}
};

export const config = convict({
	...buildSchema,
	app_server: {
		protocol: {
			format: validateProtocol,
			default: process.env.NODE_ENV === 'production'
				? 'http' // SSL handled by load balancer
				: 'https',
			env: 'DEV_SERVER_PROTOCOL', // legacy naming
		},
		// host: '0.0.0.0', ALWAYS 0.0.0.0
		port: {
			format: 'port',
			default: 8000,
			arg: 'app-port',
			env: process.env.NODE_ENV !== 'test' && 'DEV_SERVER_PORT', // don't read env in tests
		},
		key_file: {
			format: String,
			default: path.resolve(os.homedir(), '.certs', 'star.dev.meetup.com.key'),
			env: 'APP_KEY_FILE',
		},
		crt_file: {
			format: String,
			default: path.resolve(os.homedir(), '.certs', 'star.dev.meetup.com.crt'),
			env: 'APP_CRT_FILE',
		},
	},
	api: {
		protocol: {
			format: validateProtocol,
			default: 'https',
			env: 'API_PROTOCOL',
		},
		host: {
			format: validateServerHost,
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
		env: process.env.NODE_ENV !== 'test' && 'COOKIE_ENCRYPT_SECRET', // don't read env in tests
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
const appConf = config.get('app_server');
if (
	appConf.protocol === 'https' &&
	(!fs.existsSync(appConf.key_file) || !fs.existsSync(appConf.crt_file))
) {
	const message = 'Missing HTTPS cert or key for application server!';
	if (config.isProd) {
		throw new Error(message);
	}
	console.error(chalk.red(message));
	console.warn(
		chalk.yellow(
			'Re-setting protocol to HTTP - some features may not work as expected'
		)
	);
	console.warn(chalk.yellow('See MWP config docs to configure HTTPS'));
	config.set('app_server.protocol', 'http');
}
config.validate();

export default config.getProperties();
