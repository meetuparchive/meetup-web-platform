import Inert from 'inert';
import CsrfPlugin from 'electrode-csrf-jwt/lib/csrf-hapi17';
import CspPlugin from 'blankie';
import ScooterPlugin from 'scooter'; // blankie dependency

import config from 'mwp-config';
import { plugin as loggerPlugin } from 'mwp-logger-plugin';
import { plugin as appRoutePlugin } from 'mwp-app-route-plugin';
import { plugin as activityPlugin } from 'mwp-tracking-plugin/lib/activity';
import { plugin as clickPlugin } from 'mwp-tracking-plugin/lib/click';
import { plugin as languagePlugin } from 'mwp-language-plugin';
import { plugin as serviceWorkerPlugin } from 'mwp-sw-plugin';
import { plugin as apiProxyPlugin } from 'mwp-api-proxy-plugin';
import { plugin as requestAuthPlugin } from 'mwp-auth-plugin';

// single quotes are required around these keywords
const CSP_KEYWORDS = {
	self: "'self'",
	unsafeInline: "'unsafe-inline'",
	unsafeEval: "'unsafe-eval'",
};

/**
 * Hapi plugins for the dev server
 *
 * @module ServerPlugins
 */
const CSRF_COOKIE_NAME =
	process.env.NODE_ENV === 'production' ? 'x-mwp-csrf' : 'x-mwp-csrf_dev';
const CSRF_HEADER_COOKIE_NAME = `${CSRF_COOKIE_NAME}-header`;
const CSRF_HEADER_NAME = CSRF_COOKIE_NAME;

// Sets the csrf header token from plugin into a cookie
export function setCsrfCookies(request, h) {
	const csrfHeader = (request.response.headers || {})[CSRF_COOKIE_NAME];
	if (csrfHeader) {
		h.state(CSRF_HEADER_COOKIE_NAME, csrfHeader);
	}
	return h.continue;
}

/**
 * The CSRF plugin we use, 'electrode-csrf-jwt', generates a token for each request 
 * that we make and sets the token in an HTTP-only cookie (CSRF_COOKIE_NAME) and in
 * the HTTP response header (also CSRF_COOKIE_NAME). In non-GET requests we must supply
 * the latest generated token from the response header as an HTTP request header - the
 * plugin will compare the cookie token and the request header token and return a
 * BAD_TOKEN error if they do not match.
 * 
 * We updated this flow to set the token from the response header as a cookie 
 * (CSRF_COOKIE_NAME-header) and use the cookie value to set the request header
 * so that it syncs across browser tabs.
 *
 * We set similar but different cookie names for dev and prod environments so the prod
 * cookies are not read in the dev environment.
 * 
 * In order to ensure that both cookie values have parallel settings, this
 * function calls `server.state` for both cookie names before registering the
 * plugin.
 *
 * @return {Object} the { register } object for a `server.register` call.
 */
export function getCsrfPlugin(electrodeOptions) {
	const register = (server, options) => {
		const { isProd } = server.settings.app;

		const cookieOptions = {
			path: '/',
			isSecure: isProd, // No need to worry about https in dev
			isSameSite: false, // Firefox will not read SameSite cookies set on redirect (e.g. from email link), so we disable that setting
			domain: isProd ? '.meetup.com' : '.dev.meetup.com', // target the current app server domain
		};

		Object.assign(
			options,
			{ secret: server.settings.app.csrf_secret },
			electrodeOptions
		);

		server.state(
			CSRF_COOKIE_NAME, // set by plugin
			{ ...cookieOptions, isHttpOnly: true } // no client-side interaction needed
		);

		server.state(
			CSRF_HEADER_COOKIE_NAME, // set by onPreResponse
			{ ...cookieOptions, isHttpOnly: false } // the client must read this cookie and return as a custom header
		);

		const registration = CsrfPlugin.register(server, options);
		server.ext('onPreResponse', setCsrfCookies); // this extension must be registered _after_ plugin is registered

		return registration;
	};

	return {
		plugin: {
			register,
			pkg: CsrfPlugin.pkg,
		},
	};
}
/**
 * We are using Blankie as our Content Security Policy (CSP) plugin 
 * Which uses Scooter to detect the user agent and apply the appropriate
 * CSP header, usually Content-Security-Policy but some older browsers are
 * slightly different. A CSP compatible browser will use the header to ignore
 * scripts not whitelisted in our policy header.
 * https://github.com/nlf/blankie 
 */
export function getCspPlugin(options) {
	return {
		plugin: CspPlugin,
		options,
	};
}

export function getAppRoutePlugin(options) {
	return {
		plugin: appRoutePlugin,
		options,
	};
}

export function getLoggerPlugin(
	options = { logEvents: ['onPostStart', 'onPostStop', 'response'] }
) {
	return {
		plugin: loggerPlugin,
		options,
	};
}

export function getActivityTrackingPlugin({ agent, isProdApi }) {
	return {
		plugin: activityPlugin,
		options: {
			agent,
			isProdApi,
		},
	};
}

export default function getPlugins({ languageRenderers }) {
	const {
		package: { agent },
		getServer,
		env: { schema: { asset_server } },
	} = config;
	const server = getServer();
	const isProdApi = server.properties.api.isProd;

	return [
		getAppRoutePlugin({ languageRenderers }),
		apiProxyPlugin,
		languagePlugin,
		getLoggerPlugin(),
		getCsrfPlugin({
			headerName: CSRF_HEADER_NAME,
			cookieName: CSRF_COOKIE_NAME,
		}),
		ScooterPlugin, // csp plugin (blankie) dependency
		getCspPlugin({
			defaultSrc: [
				CSP_KEYWORDS.self,
				'*.meetup.com',
				`*.dev.meetup.com:${asset_server.port.default}`,
			].join(' '),
			connectSrc: '*',
			frameSrc: '*',
			imgSrc: '*',
			styleSrc: ['*', CSP_KEYWORDS.unsafeInline].join(' '),
			scriptSrc: ['*', CSP_KEYWORDS.unsafeEval, CSP_KEYWORDS.unsafeInline].join(
				' '
			),
			generateNonces: 'false',
		}),
		requestAuthPlugin,
		getActivityTrackingPlugin({ agent, isProdApi }),
		clickPlugin,
		serviceWorkerPlugin,
		Inert,
	];
}
