import fs from 'fs';
import convict from 'convict';
import path from 'path';

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

export const PROTOCOL_ERROR = 'Protocol must be http or https';

export const validateProtocol = protocol => {
	if (!['http', 'https'].includes(protocol)) {
		throw new Error(PROTOCOL_ERROR);
	}
};

export const schema = {
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
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
			env: process.env.NODE_ENV !== 'test' && 'DEV_SERVER_PORT', // don't read env in tests
		},
	},
	disable_hmr: {
		format: Boolean,
		default: false,
		env: 'DISABLE_HMR',
	},
	isDev: {
		format: Boolean,
		default: true,
	},
	isProd: {
		format: Boolean,
		default: false,
	},
};
export const config = convict(schema);

// Load environment dependent configuration
const configPath = path.resolve(
	process.cwd(),
	`config.${config.get('env')}.json`
);

if (fs.existsSync(configPath)) {
	const buildConfig = require(configPath).buildtime || {};
	config.load(buildConfig);
}

config.set(
	'api.root_url',
	`${config.get('api.protocol')}://${config.get('api.host')}`
);

config.set('isProd', config.get('env') === 'production');
config.set('isDev', config.get('env') === 'development');
config.validate();

export default config.getProperties();
