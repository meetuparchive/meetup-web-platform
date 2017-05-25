import fs from 'fs';
import convict from 'convict';
import path from 'path';

/**
 * This module populates build time configuration data
 */

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

export const schema = {
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
	},
	asset_server: {
		host: {
			format: validateServerHost,
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
			default: 8001, // must be 443 for prod
			arg: 'asset-port',
			env: process.env.NODE_ENV !== 'test' && 'ASSET_SERVER_PORT', // don't read env in tests
		},
	},
	app_server: {
		protocol: {
			format: validateProtocol,
			default: 'http',
			env: 'DEV_SERVER_PROTOCOL', // legacy naming
		},
		// host: 0.0.0.0', ALWAYS 0.0.0.0
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

export const { asset_server, app_server } = fs.existsSync(configPath)
	? require(configPath)
	: {};
// only load buildtime vars - nothing else from config file
if (asset_server) {
	config.load({ asset_server });
}
if (app_server) {
	config.load({ app_server });
}

config.set('isProd', config.get('env') === 'production');
config.set('isDev', config.get('env') === 'development');
config.validate();

export default config.getProperties();
