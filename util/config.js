import chalk from 'chalk';
import { ANONYMOUS_AUTH_APP_PATH } from '../epics/auth';
/**
 * Start the server with a config
 *
 * This module provides a Promise-based interface for assembling a
 * configuration object and passing it to the server startup function.
 * @module config
 */

export default function getConfig(overrideConfig) {
	/**
	 * Read all config from environment variables here once on startup
	 */
	const config = {
		DEV_SERVER_PORT: process.env.DEV_SERVER_PORT || 8000,
		API_PROTOCOL: process.env.API_PROTOCOL || 'https',
		API_HOST: process.env.API_HOST || 'api.dev.meetup.com',
		ANONYMOUS_AUTH_URL: process.env.ANONYMOUS_AUTH_URL || 'https://secure.dev.meetup.com/oauth2/authorize',
		ANONYMOUS_ACCESS_URL: process.env.ANONYMOUS_ACCESS_URL || 'https://secure.dev.meetup.com/oauth2/access',
		PHOTO_SCALER_SALT: process.env.PHOTO_SCALER_SALT,
		ANONYMOUS_AUTH_APP_PATH,
		oauth: {
			secret: process.env.MUPWEB_OAUTH_SECRET,
			key: process.env.MUPWEB_OAUTH_KEY,
		},
	};
	config.API_SERVER_ROOT_URL = `${config.API_PROTOCOL}://${config.API_HOST}`;

	// currently all config is available syncronously, so resolve immediately
	return Promise.resolve(overrideConfig || config)
		.then(validateConfig);
}

function validateConfig(config) {
	if (!config) {
		console.log(chalk.red('No config loaded'));
		return false;
	}
	if (!config.oauth || !config.oauth.secret || !config.oauth.key) {
		console.log(chalk.red(`MUPWEB_OAUTH_SECRET and MUPWEB_OAUTH_KEY must be set as environment variables
- get the values from an admin in #web-platform on Slack`));
		return false;
	}
	if (!config.PHOTO_SCALER_SALT) {
		console.log(chalk.red(`PHOTO_SCALER_SALT must be set as an environment variable
- get the value from an admin in #web-platform on Slack`));
		return false;
	}
	return config;
}


