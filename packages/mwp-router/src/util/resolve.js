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
export const getChildRoutes = (
	matchedRoute: MatchedRoute
): Array<PlatformRoute> => {
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
	const { match, route } = matchedRoute;
	if (match.isExact) {
		return _resolveIndexRoute(route).then(
			r => (r.indexRoute ? [r.indexRoute] : [])
		);
	}
	return _resolveNestedRoutes(route).then(r => r.routes || []);
};

const _resolveNestedRoutes: Resolver<PlatformRoute> = ({
	getNestedRoutes,
	...noGetNestedRoutes
}) =>
	getNestedRoutes
		? getNestedRoutes().then(routes => ({ ...noGetNestedRoutes, routes }))
		: Promise.resolve(noGetNestedRoutes);

const _resolveIndexRoute: Resolver<PlatformRoute> = ({
	getIndexRoute,
	...noGetIndexRoute
}) =>
	getIndexRoute
		? getIndexRoute().then(indexRoute => ({ ...noGetIndexRoute, indexRoute }))
		: Promise.resolve(noGetIndexRoute);

// resolve the `component` property
const resolveComponent = ({
	getComponent,
	...noGetCompRoute
}: PlatformRoute): Promise<PlatformRoute> =>
	getComponent
		? getComponent().then(component => ({ ...noGetCompRoute, component }))
		: Promise.resolve(noGetCompRoute);

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
	return resolveComponent(route)
		.then(route => ({
			match,
			route,
		}))
		.then(resolveChildRoutes)
		.then(
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
export const getRouteResolver = (
	routes: Array<PlatformRoute>,
	basename: string
) => (location: URL): Promise<Array<MatchedRoute>> => {
	const path = location.pathname.replace(basename, '');
	return _resolveRouteMatches(routes, path);
};

export const resolveRoute = (route: PlatformRoute): Promise<PlatformRoute> => {
	return _resolveIndexRoute(route)
		.then(_resolveNestedRoutes)
		.then(resolveComponent)
		.then(({ routes, getComponent, ...noRoutesRoute }: PlatformRoute) =>
			resolveAllRoutes(routes || []).then((routes: Array<PlatformRoute>) =>
				Object.freeze({
					...noRoutesRoute,
					routes,
				})
			)
		);
};

export const resolveAllRoutes = (
	routes: Array<PlatformRoute>
): Promise<Array<PlatformRoute>> => {
	return Promise.all(routes.map(resolveRoute));
};
