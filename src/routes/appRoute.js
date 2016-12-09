import { getAppRouteHandler } from './appRouteHandler';

/**
 * Only one wildcard route for all application GET requests - exceptions are
 * described in the routes above
 */
const getApplicationRoute = renderRequestMap => ({
	method: 'GET',
	path: '/{wild*}',
	handler: getAppRouteHandler(renderRequestMap),
});

export default getApplicationRoute;

