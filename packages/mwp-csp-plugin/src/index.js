// @flow
import blankie from 'blankie';

// Plugin sets content security policy headers
export function register(
	server: HapiServer,
	options: ?{ [string]: string }
): Promise<any> {
	server.ext('onPreResponse', (request, h) => {
		// Tells browser that it should only be accessed using HTTPS & how long to remember that
		request.response.header('Strict-Transport-Security', 'max-age=7776000'); // 3 months

		// Enables XSS filtering. Browser will prevent rendering of the page if an attack is detected.
		request.response.header('X-XSS-Protection', '1; mode=block');
		return h.continue;
	});
	/**
     * We are using Blankie to set our Content-Security-Policy header, which uses Scooter to
     * detect the user agent and apply the appropriate CSP header, usually Content-Security-Policy
     * but some older browsers are slightly different. A CSP compatible browser will use the header
     * to ignore scripts not whitelisted in our policy header. https://github.com/nlf/blankie 
     */
	return blankie.plugin.register(server, options);
}

export const plugin = {
	register,
	name: 'mwp-csp',
	version: '1.0.0',
	depencencies: [
		'blankie', // sets `Content-Security-Policy` header based on user agent
		'scooter', // blankie dependency for detecting user agent
	],
};
