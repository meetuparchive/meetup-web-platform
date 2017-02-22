import Joi from 'joi';
import {
	duotones,
	getDuotoneUrls
} from './duotone';
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
	if (!process.env.OAUTH_ACCESS_URL && process.env.ANONYMOUS_ACCESS_URL) {
		console.warn('The ANONYMOUS_ACCESS_URL env variable is deprecated - please rename to OAUTH_ACCESS_URL');
	}
	if (!process.env.OAUTH_AUTH_URL && process.env.ANONYMOUS_AUTH_URL) {
		console.warn('The ANONYMOUS_AUTH_URL env variable is deprecated - please rename to OAUTH_AUTH_URL');
	}
	const config = {
		API_PROTOCOL: process.env.API_PROTOCOL || 'https',
		API_HOST: process.env.API_HOST || 'api.dev.meetup.com',
		COOKIE_ENCRYPT_SECRET: process.env.COOKIE_ENCRYPT_SECRET,
		CSRF_SECRET: process.env.CSRF_SECRET,
		DEV_SERVER_PORT: process.env.DEV_SERVER_PORT || 8000,
		OAUTH_AUTH_URL: process.env.OAUTH_AUTH_URL ||
			process.env.ANONYMOUS_AUTH_URL ||
			'https://secure.dev.meetup.com/oauth2/authorize',
		OAUTH_ACCESS_URL: process.env.OAUTH_ACCESS_URL ||
			process.env.ANONYMOUS_ACCESS_URL ||
			'https://secure.dev.meetup.com/oauth2/access',
		PHOTO_SCALER_SALT: process.env.PHOTO_SCALER_SALT,
		oauth: {
			secret: process.env.MUPWEB_OAUTH_SECRET,
			key: process.env.MUPWEB_OAUTH_KEY,
		},
	};
	config.duotoneUrls = getDuotoneUrls(duotones, config.PHOTO_SCALER_SALT);
	config.API_SERVER_ROOT_URL = `${config.API_PROTOCOL}://${config.API_HOST}`;

	// currently all config is available syncronously, so resolve immediately
	return Promise.resolve({ ...config, ...overrideConfig })
		.then(validateConfig);
}

function validateConfig(config) {
	const oauthError = new Error('get oauth secrets from web platform team');
	const configSchema = Joi.object().keys({
		API_PROTOCOL: Joi.any().only(['https', 'http']).required(),
		API_HOST: Joi.string().hostname().required(),
		API_SERVER_ROOT_URL: Joi.string().uri(),
		COOKIE_ENCRYPT_SECRET: Joi.string().min(32).required().error(
			new Error('set COOKIE_ENCRYPT_SECRET env variable to a random 32+ character string')
		),
		CSRF_SECRET: Joi.string().min(32).required().error(
			new Error('set CSRF_SECRET env variable to a random 32+ character string')
		),
		DEV_SERVER_PORT: Joi.number().integer().max(65535),
		OAUTH_AUTH_URL: Joi.string().uri().required(),
		OAUTH_ACCESS_URL: Joi.string().uri().required(),
		PHOTO_SCALER_SALT: Joi.string().min(1).required().error(
			new Error('get PHOTO_SCALER_SALT from web platform team')
		),
		oauth: Joi.object().keys({
			secret: Joi.string().min(1).required().error(oauthError),
			key: Joi.string().min(1).required().error(oauthError),
		}).required(),
		duotoneUrls: Joi.array().items(Joi.string().uri()),
	}).required();

	const result = Joi.validate(config, configSchema);
	if (result.error) {
		throw result.error;
	}
	return result.value;
}

