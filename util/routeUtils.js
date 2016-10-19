/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */

export function getRouteQueries(route) {
	if (!route) {
		return [];
	}
	const { parent, query } = route;
	const routeQueries = query instanceof Array ? query : [query];
	return [ ...routeQueries, ...getRouteQueries(parent) ];
}

export const activeRouteQueries = ({ result }) => getRouteQueries(result);
