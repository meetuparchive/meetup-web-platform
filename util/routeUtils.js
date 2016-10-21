/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */

function getParentRoutes(routeResult) {
	if (!routeResult) {
		return [];
	}
	return [
		routeResult.route,
		...getParentRoutes(routeResult.parent)
	];
}


export const activeRouteQueries = routes => location =>
	[
		location.route,
		...getParentRoutes(location.result.parent)
	]
	.map(path => routes[path].query)
	.filter(q => q)
	.map(q => q instanceof Array ? q : [q])
	.reduce((queries, query) => ([ ...queries, ...query ]), [])
	.map(query => query(location));  // call the query function

