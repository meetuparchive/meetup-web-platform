/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */
import matchPath from 'react-router-dom/matchPath';

export const getRouteQueries = (route, params) => {
	if (!route.query) {
		return [];
	}
	const routeQueryFns = route.query instanceof Array ?
		route.query :
		[route.query];

	return routeQueryFns
		.map(queryFn => queryFn({ params }))
		.filter(query => query);
};

export const matchedRouteQueriesReducer = url => (queries, route) => {
	const match = matchPath(url, route.path);
	if (!match) {
		return queries;
	}

	const currentQueries = [ ...queries, ...getRouteQueries(route, match.params) ];

	if (!route.routes || !route.routes.length) {
		return currentQueries;
	}

	const unmatchedUrl = route.path ? url.replace(match.url, '') : match.url;
	return route.routes.reduce(
		matchedRouteQueriesReducer(unmatchedUrl),
		currentQueries
	);
};

/**
 * Get the queries from all currently-active routes at the requested url path
 * @param {Array} routes an array of route objects
 * @param {String} url the current URL path
 * @return {Array} the queries attached to the active routes
 */
export const activeRouteQueries = routes => url =>
	routes.reduce(matchedRouteQueriesReducer(url), []);

