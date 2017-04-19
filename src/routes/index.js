import logger from '../util/logger';

import apiProxy$ from '../apiProxy/api-proxy';

import getApiProxyRoutes from '../apiProxy/apiProxyRoutes';
import getApplicationRoute from './appRoute';

export default function getRoutes(renderRequestMap, apiProxyFn$=apiProxy$) {

	logger.info(`Supported languages:\n${Object.keys(renderRequestMap).join('\n')}`);

	const pingRoute = {
		path: '/ping',
		method: 'GET',
		handler: (request, reply) => reply('pong!'),
		config: { auth: false }
	};

	return [
		pingRoute,
		...getApiProxyRoutes('/mu_api', apiProxyFn$),
		getApplicationRoute(renderRequestMap),
	];

}

