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

export const decodeParams = (params: { [string]: any }): Params =>
	Object.keys(params).reduce((decodedParams, key) => {
		if (typeof params[key] !== 'undefined') {
			// skip 'undefined' values that cannot be encoded (null is okay)
			decodedParams[key] = params[key] && decodeURI(params[key]);
		}
		return decodedParams;
	}, {});

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
 * find all routes from a given array of route config objects that match the
 * supplied `location`
 *
 * this function matches the signature of `react-router-config`'s `_resolveRouteMatches`
 * function, but interprets all `route.path` settings as nested
 *
 * @see {@link https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config#matchroutesroutes-pathname}
 */
/*
 * Collect the return values of each query functions associated with the matched
 * routes, called with the provided location URL
 *
 * The function returned from calling `_matchedRouteQueriesReducer` with a
 * `location` should be used as the callback to an `array.reduce` call.
 */
const _matchedRouteQueriesReducer = (location: URL) => (
	queries: Array<Query>,
	{ route, match }: MatchedRoute
): Array<Query> => {
	if (!route.query) {
		return queries;
	}
	const routeQueryFns = route.query instanceof Array
		? route.query
		: [route.query];

	// call the query functions with non-url-encoded params
	const params = decodeParams(match.params);
	const routeQueries = routeQueryFns
		.map(queryFn => queryFn({ location, params }))
		.filter(query => query);

	return [...queries, ...routeQueries];
};

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
 * An curried interface into `_resolveRouteMatches`, using `baseUrl`
 * + `location` instead of `path`
 */
export const getRouteResolver = (
	routes: Array<PlatformRoute>,
	baseUrl: string
) => (location: URL): Promise<Array<MatchedRoute>> => {
	const path = location.pathname.replace(baseUrl, '');
	return _resolveRouteMatches(routes, path);
};

/*
 * A synchronous, curried interface to derive the query values returned by the
 * query functions of a provided set of routes given a particular location
 */
export const getMatchedQueries = (location: URL) => (
	matchedRoutes: Array<MatchedRoute>
): Array<Query> =>
	matchedRoutes.reduce(_matchedRouteQueriesReducer(location), []);

/*
 * A curried interface into `_resolveRouteMatches` + `getMatchedQueries`
 */
export const activeRouteQueries = (
	routes: Array<PlatformRoute>,
	baseUrl: string
) => {
	const resolveRoutes = getRouteResolver(routes, baseUrl);
	return (location: URL) =>
		resolveRoutes(location).then(getMatchedQueries(location));
};
