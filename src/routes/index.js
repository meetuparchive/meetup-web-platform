import apiProxy$ from '../apiProxy/api-proxy';

import getApiProxyRoutes from '../apiProxy/apiProxyRoutes';

export default function getRoutes(apiProxyFn$ = apiProxy$) {
	const pingRoute = {
		path: '/ping',
		method: 'GET',
		handler: (request, reply) => reply('pong!'),
		config: { auth: false },
	};

	// simple 200 response for all lifecycle requests
	// https://cloud.google.com/appengine/docs/flexible/python/how-instances-are-managed#health_checking
	const appEngineLifecycleRoutes = {
		method: 'GET',
		path: '/_ah/{param*}',
		config: { auth: false },
		handler: (request, reply) => reply('OK'),
	};

	return [
		pingRoute,
		appEngineLifecycleRoutes,
		...getApiProxyRoutes('/mu_api', apiProxyFn$),
	];
}
