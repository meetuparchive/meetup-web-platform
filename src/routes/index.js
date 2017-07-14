import logger from '../util/logger';

import getApplicationRoute from './appRoute';

export default function getRoutes(renderRequestMap) {
	logger.info(
		`Supported languages:\n${Object.keys(renderRequestMap).join('\n')}`
	);

	const pingRoute = {
		path: '/ping',
		method: 'GET',
		handler: (request, reply) => reply('pong!'),
		config: { auth: false },
	};

	return [pingRoute, getApplicationRoute(renderRequestMap)];
}
