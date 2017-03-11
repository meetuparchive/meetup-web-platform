/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */
import matchPath from 'react-router-dom/matchPath';

export const getNestedRoutes = ({ route, match }) =>
	match.isExact && route.indexRoute ?
		[route.indexRoute] :   // only render index route
		route.routes;          // pass along any defined nested routes

/**
 * A recursive reducer that finds all the routes that match a given url. Route
 * `path` keys are interpreted as being extensions of their parent route's `path`
 * @param {String} url a URL path (no host) starting with `/`
 * @param {String} matchedUrl the part of the `url` that has been previously matched
 * @param {Array} matchedRoutes an array of [ route, match ] tuples
 * @param {Object} route the current route being matched
 * @return {Array} an array of { route, match } objects
 */
export const matchRoutesReducer = (url, matchedUrl='') => (matchedRoutes, route) => {
	const pathToMatch = `${matchedUrl}${route.path || ''}`;
	const match = matchPath(url, pathToMatch);
	if (!match) {
		return matchedRoutes;
	}

	const matchedRoute = { route, match };
	// we have a match, add it and its `match` object to the array of matched routes
	const currentMatchedRoutes = [ ...matchedRoutes, matchedRoute ];
	if (!route.routes || !route.routes.length) {
		return currentMatchedRoutes;
	}

	return getNestedRoutes(matchedRoute).reduce(
		matchRoutesReducer(url, match.url),
		currentMatchedRoutes
	);
};

/**
 * find all routes from a given route config object that match the supplied
 * `url`
 *
 * this function matches the signature of `react-router-config`'s `matchRoutes`
 * function, but interprets all `route.path` settings as nested
 *
 * @see {@link https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config#matchroutesroutes-pathname}
 *
 * @param {Array} routes an array of route configs
 * @param {String} url a URL path (no host) starting with `/`
 * @return {Array} an array of { route, match } objects
 */
export const matchRoutes = (routes, url) =>
	routes.reduce(matchRoutesReducer(url), []);

/**
 * @param {Array} queries an array of query function results
 * @param {Object} matchedRoute a { route, match } object to inspect for query functions
 * @return {Array} an array of returned query objects
 */
export const matchedRouteQueriesReducer = (queries, { route, match }) => {
	if (!route.query) {
		return queries;
	}
	const routeQueryFns = route.query instanceof Array ?
		route.query :
		[route.query];

	const routeQueries = routeQueryFns
		.map(queryFn => queryFn(match))
		.filter(query => query);

	return [
		...queries,
		...routeQueries,
	];
};

/**
 * Get the queries from all currently-active routes at the requested url path
 * @param {Array} routes an array of route objects
 * @param {String} url the current URL path
 * @return {Array} the queries attached to the active routes
 */
export const activeRouteQueries = routes => url =>
	matchRoutes(routes, url).reduce(matchedRouteQueriesReducer, []);

