import chalk from 'chalk';

import apiProxy$ from '../apiProxy/api-proxy';

import getApiProxyRoutes from '../apiProxy/apiProxyRoutes';
import getApplicationRoute from './appRoute';

export default function getRoutes(renderRequestMap, env, apiProxyFn$ = apiProxy$) {

	console.log(
		chalk.green(`Supported languages:\n${Object.keys(renderRequestMap).join('\n')}`)
	);

	return [
		...getApiProxyRoutes('/api', env, apiProxyFn$),
		getApplicationRoute(renderRequestMap),
	];
}

