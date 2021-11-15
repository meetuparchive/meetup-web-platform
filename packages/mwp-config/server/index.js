const fs = require('fs');
const os = require('os');
const path = require('path');

const chalk = require('chalk');
const convict = require('convict');

const packageConfig = require('../package');

const { schema: envSchema, properties: envProperties } = require('../env');

const {
	secretDefault,
	validateCookieSecret,
	validateCsrfSecret,
	validatePhotoScalerSalt,
	validateProtocol,
} = require('./util');

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
 * - `PHOTO_SCALER_SALT`
 *
 * @module config
 */
const schema = Object.assign({}, envSchema, {
	app_server: {
		protocol: {
			format: validateProtocol,
			default:
				process.env.NODE_ENV === 'production'
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
		api_proxy_path: {
			format: String,
			default: packageConfig.apiProxyPath || '/mu_api',
			env: 'API_PROXY_PATH',
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
			format: String,
			default: 'api.dev.meetup.com',
			env: 'API_HOST',
		},
		timeout: {
			format: 'int',
			default: 10000,
			env: 'API_TIMEOUT',
		},
		root_url: {
			format: String,
			default: '',
		},
		// Using the prod API is _independent_ of env.isProd
		isProd: {
			format: Boolean,
			default: false,
		},
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
	photo_scaler_salt: {
		format: validatePhotoScalerSalt,
		default: process.env.NODE_ENV === 'test' ? secretDefault : null,
		env: 'PHOTO_SCALER_SALT',
		sensitive: true,
	},
});

const config = convict(schema);

config.load(envProperties);

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
// api.isProd is determined exclusively by api.host value
config.set('api.isProd', !config.get('api.host').includes('.dev.'));

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
	if (process.NODE_ENV !== 'test') {
		console.error(chalk.red(message));
		console.warn(
			chalk.yellow(
				'Re-setting protocol to HTTP - some features may not work as expected'
			)
		);
		console.warn(chalk.yellow('See MWP config docs to configure HTTPS'));
	}
	config.set('app_server.protocol', 'http');
}
config.validate();

module.exports = {
	config,
	schema,
	properties: config.getProperties(),
};
