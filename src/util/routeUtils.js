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

export const matchedRouteQueriesReducer = (url, matchedUrl='') => (queries, route) => {
	const pathToMatch = `${matchedUrl}${route.path || ''}`;
	console.log(url, pathToMatch);
	const match = matchPath(url, pathToMatch);
	if (!match) {
		return queries;
	}

	const currentQueries = [ ...queries, ...getRouteQueries(route, match.params) ];

	if (!route.routes || !route.routes.length) {
		return currentQueries;
	}

	const nestedRoutes = match.isExact && route.indexRoute ?
		[route.indexRoute] :   // only render index route
		route.routes;          // pass along any defined nested routes

	return nestedRoutes.reduce(
		matchedRouteQueriesReducer(url, match.url),
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

