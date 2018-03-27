// @flow
/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */
import matchPath from 'react-router-dom/matchPath';

// A type for functions that mutate an object asynchronously
type Resolver<T> = (input: T) => Promise<T>;

// munge a route's 'relative' `path` with the full matchedPath
const _routeMatchOptions = (
	route: PlatformRoute,
	matchedPath: string
): MatchPathOptions => ({
	path: `${matchedPath}${route.path || ''}`.replace('//', '/'),
	strict: route.strict,
	exact: route.exact,
});

/*
 * Determine whether the indexRoute or nested route should be considered the
 * child route for a particular MatchedRoute
 */
export const getChildRoutes = (matchedRoute: MatchedRoute): Array<PlatformRoute> => {
	const { route, match } = matchedRoute;
	if (match.isExact) {
		return route.indexRoute ? [route.indexRoute] : [];
	}
	return route.routes || [];
};

/*
 * Given a matched route, return the expected child route(s). This function
 * encapsulates the logic for selecting between the `indexRoute` and the
 * child `routes` array
 *
 * This is essentially an async `getChildRoutes`
 */
export const resolveChildRoutes = (
	matchedRoute: MatchedRoute
): Promise<Array<PlatformRoute>> => {
	const { match } = matchedRoute;
	if (match.isExact) {
		return _resolveIndexRoute(matchedRoute).then(
			m => (m.route.indexRoute ? [m.route.indexRoute] : [])
		);
	}
	return _resolveNestedRoutes(matchedRoute).then(m => m.route.routes || []);
};

const _resolveNestedRoutes: Resolver<MatchedRoute> = matchedRoute =>
	matchedRoute.route.getNestedRoutes
		? matchedRoute.route
				.getNestedRoutes()
				.then(routes => (matchedRoute.route.routes = routes))
				.then(() => matchedRoute)
		: Promise.resolve(matchedRoute);

const _resolveIndexRoute: Resolver<MatchedRoute> = matchedRoute =>
	matchedRoute.route.getIndexRoute
		? matchedRoute.route
				.getIndexRoute()
				.then(indexRoute => (matchedRoute.route.indexRoute = indexRoute))
				.then(() => matchedRoute)
		: Promise.resolve(matchedRoute);

/*
 * Find all routes in the routes array that match the provided URL, including
 * nested routes that may be async
 */
const _resolveRouteMatches = (
	routes: Array<PlatformRoute> = [],
	path: string = '',
	matchedRoutes: Array<MatchedRoute> = [],
	matchedPath: string = ''
): Promise<Array<MatchedRoute>> => {
	const route = routes.find(r =>
		matchPath(path, _routeMatchOptions(r, matchedPath))
	); // take the first match
	if (!route) {
		return Promise.resolve(matchedRoutes);
	}

	// add the route and its `match` object to the array of matched routes
	const currentMatchOptions = _routeMatchOptions(route, matchedPath);
	const match = matchPath(path, currentMatchOptions);
	if (!match) {
		// we know that this won't ever run because we've established the match in
		// `.find`, but this check is for type safety
		return Promise.resolve(matchedRoutes);
	}
	const matchedRoute = { route, match };
	const currentMatchedRoutes = [...matchedRoutes, matchedRoute];

	// add any nested route matches
	return resolveChildRoutes(matchedRoute).then(
		childRoutes =>
			childRoutes.length
				? _resolveRouteMatches(
						childRoutes,
						path,
						currentMatchedRoutes,
						currentMatchOptions.path
				  )
				: currentMatchedRoutes
	);
};

/*
 * An curried interface into `_resolveRouteMatches`, using `basename`
 * + `location` instead of `path`
 */
export const getRouteResolver = (routes: Array<PlatformRoute>, basename: string) => (
	location: URL
): Promise<Array<MatchedRoute>> => {
	const path = location.pathname.replace(basename, '');
	return _resolveRouteMatches(routes, path);
};
