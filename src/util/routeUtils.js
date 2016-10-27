/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */

function getParentQueries(routeResult) {
	if (!routeResult) {
		return [];
	}
	console.log(routeResult);
	return [
		routeResult.query,
		...getParentQueries(routeResult.parent)
	];
}


export const activeRouteQueries = location =>
	[
		location.result.query,
		...getParentQueries(location.result.parent)
	]
	.filter(q => q)
	.map(q => q instanceof Array ? q : [q])
	.reduce((queries, query) => ([ ...queries, ...query ]), [])
	.map(query => query(location));  // call the query function

