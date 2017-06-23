// @flow
const buildPaths = require('mwp-cli/src/commands/buildCommands/config/paths');
const path = require('path');

/*
 * The service worker plugin will register a root-level route for serving the
 * service worker script file.
 *
 * The location of the script file is determined by plugin config.
 */
export default function register(
	server: Object,
	options: ?Object,
	next: () => void
) {
	/*
	 * Route for service worker script at top-level path. Depends on `Inert`
	 */
	server.route({
		method: 'GET',
		path: '/asset-service-worker.{localeCode}.js', // must match client `serviceWorker.register` call
		config: {
			auth: false,
		},
		handler: (request, reply) => {
			const { localeCode } = request.params;
			const swPath = path.resolve(
				buildPaths.browserAppOutputPath,
				localeCode,
				'asset-service-worker.js'
			);
			reply.file(swPath).type('application/javascript');
		},
	});

	next();
}

register.attributes = {
	name: 'mwp-service-worker',
	version: '1.0.0',
	dependencies: 'inert', // decorates `reply.file`
};
