// @flow
/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */
import matchPath from 'react-router-dom/matchPath';

// resolve the `component` property
const resolveComponent = (
	route: PlatformRoute
): Promise<React$ComponentType<*>> => {
	if (route.component) {
		return Promise.resolve(route.component);
	}
	return route.getComponent();
};

export const resolveRoute = (
	route: PlatformRoute
): Promise<StaticPlatformRoute> =>
	Promise.all([
		resolveComponent(route),
		resolveAllRoutes(route.routes || []),
	]).then(
		(
			[component: React$ComponentType<*>, routes: Array<StaticPlatformRoute>]
		): StaticPlatformRoute =>
			Object.freeze({
				// $FlowFixMe - Flow believes that `routes` might contain an AsyncPlatformRoute
				routes,
				...addComponentToRoute(route)(component),
			})
	);

export const resolveAllRoutes = (
	routes: Array<PlatformRoute>
): Promise<Array<StaticPlatformRoute>> => {
	return Promise.all(routes.map(resolveRoute));
};

/* FUNCTIONS THAT USE LOCATION/MATCH LOGIC */
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
export const getMatchedChildRoutes = (
	matchedRoute: MatchedRoute
): Array<PlatformRoute> => {
	const { route, match } = matchedRoute;
	if (match.isExact) {
		return route.indexRoute ? [route.indexRoute] : [];
	}
	return route.routes || [];
};

const addComponentToRoute = (route: PlatformRoute) => (
	component: React$ComponentType<*>
): StaticPlatformRoute => {
	if (!route.getComponent) {
		return Object.freeze({ component, ...route });
	}
	// eslint-disable-next-line no-unused-vars
	const { getComponent, ...noGetCompRoute } = route;
	return Object.freeze({ component, ...noGetCompRoute });
};

/*
 * Find all routes in the routes array that match the provided URL, including
 * nested routes that may have async components
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
		.then(addComponentToRoute(route))
		.then((route: StaticPlatformRoute): MatchedRoute => ({ match, route }))
		.then(getMatchedChildRoutes)
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
 * A curried interface into `_resolveRouteMatches`, using `basename`
 * + `location` instead of `path`
 */
export const getRouteResolver = (
	routes: Array<PlatformRoute>,
	basename: string
) => (location: URL): Promise<Array<MatchedRoute>> => {
	const path = location.pathname.replace(basename, '');
	return _resolveRouteMatches(routes, path);
};
