import fs from 'fs';
import convict from 'convict';
import path from 'path';

/**
 * This module populates build time configuration data
 */

export const schema = {
	// asset server is needed for dev build in order to set up HMR server
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
			default: 8001, // must be 443 for prod
			arg: 'asset-port',
			env: process.env.NODE_ENV !== 'test' && 'ASSET_SERVER_PORT', // don't read env in tests
		},
		protocol: {
			format: String,
			default: 'http',
			env: 'ASSET_SERVER_PROTOCOL',
		},
		key_file: {
			format: String,
			default: '',
			env: 'KEY_FILE',
		},
		crt_file: {
			format: String,
			default: '',
			env: 'CRT_FILE',
		},
	},
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
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

const configPath = path.resolve(
	process.cwd(),
	`config.${config.get('env')}.json`
);

export const { asset_server } = fs.existsSync(configPath)
	? require(configPath)
	: {};
if (asset_server) {
	config.load({ asset_server });
}

config.set('isProd', config.get('env') === 'production');
config.set('isDev', config.get('env') === 'development');
config.validate();

export default config.getProperties();
