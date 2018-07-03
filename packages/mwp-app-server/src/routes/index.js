export default function getRoutes() {
	const pingRoute = {
		path: '/ping',
		method: 'GET',
		handler: (request, h) => 'pong!',
		options: {
			auth: false,
			plugins: {
				'mwp-logger-plugin': {
					enabled: false,
				},
			},
		},
	};

	// simple 200 response for all lifecycle requests
	// https://cloud.google.com/appengine/docs/flexible/python/how-instances-are-managed#health_checking
	const appEngineLifecycleRoutes = {
		method: 'GET',
		path: '/_ah/{param*}',
		options: {
			auth: false,
			plugins: {
				'mwp-logger-plugin': {
					enabled: false,
				},
			},
		},
		handler: (request, h) => {
			if (request.params.param === 'error') {
				throw new Error('Simulated error via url');
			}
			return 'OK';
		},
	};

	return [pingRoute, appEngineLifecycleRoutes];
}
