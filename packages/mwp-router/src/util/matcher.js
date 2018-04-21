// @flow
import matchPath from 'react-router-dom/matchPath';

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

/*
 * Find all routes in the routes array that match the provided URL, including
 * nested routes that may have async components
 */
const _getFindMatchesPath = (routes: Array<PlatformRoute> = []) => (
	path: string = '',
	matchedRoutes: Array<MatchedRoute> = [],
	matchedPath: string = ''
): Array<MatchedRoute> => {
	const route = routes.find(r =>
		matchPath(path, _routeMatchOptions(r, matchedPath))
	); // take the first match
	if (!route) {
		return matchedRoutes;
	}

	// add the route and its `match` object to the array of matched routes
	const currentMatchOptions = _routeMatchOptions(route, matchedPath);
	const match = matchPath(path, currentMatchOptions);
	if (!match) {
		// we know that this won't ever run because we've established the match in
		// `.find`, but this check is for type safety
		return matchedRoutes;
	}
	const matchedRoute = { route, match };
	const currentMatchedRoutes = [...matchedRoutes, matchedRoute];

	// recurse using child route(s)
	return _getFindMatchesPath(getMatchedChildRoutes(matchedRoute))(
		path,
		currentMatchedRoutes,
		currentMatchOptions.path
	);
};

/*
 * A curried interface into `_getFindMatchesPath`, using `basename`
 * + `location` instead of `path`
 */
export const getFindMatches = (
	routes: Array<PlatformRoute>,
	basename: string
) => {
	const findMatches = _getFindMatchesPath(routes);
	return (location: URL): Array<MatchedRoute> =>
		findMatches(location.pathname.replace(basename, ''));
};
