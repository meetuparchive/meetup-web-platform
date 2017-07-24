import apiProxy$ from '../apiProxy/api-proxy';

import getApiProxyRoutes from '../apiProxy/apiProxyRoutes';

export default function getRoutes(apiProxyFn$ = apiProxy$) {
	const pingRoute = {
		path: '/ping',
		method: 'GET',
		handler: (request, reply) => reply('pong!'),
		config: { auth: false },
	};

	return [pingRoute, ...getApiProxyRoutes('/mu_api', apiProxyFn$)];
}
