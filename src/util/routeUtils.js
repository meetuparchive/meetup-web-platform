// @flow
/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */
import matchPath from 'react-router-dom/matchPath';

// A type for mutating object an object asynchronously
type Resolver<T> = (input: T) => Promise<T>;

export const decodeParams = (params: Object) =>
	Object.keys(params).reduce((decodedParams, key) => {
		decodedParams[key] = params[key] && decodeURI(params[key]);
		return decodedParams;
	}, {});

const resolveNestedRoutes: Resolver<MatchedRoute> = matchedRoute =>
	(matchedRoute.route.getNestedRoutes
		? matchedRoute.route
				.getNestedRoutes()
				.then(routes => (matchedRoute.route.routes = routes))
				.then(() => matchedRoute)
		: Promise.resolve(matchedRoute));

const resolveIndexRoute: Resolver<MatchedRoute> = matchedRoute =>
	(matchedRoute.route.getIndexRoute
		? matchedRoute.route
				.getIndexRoute()
				.then(indexRoute => (matchedRoute.route.indexRoute = indexRoute))
				.then(() => matchedRoute)
		: Promise.resolve(matchedRoute));

/*
 * Given a matched route, return the expected child route(s). This function
 * encapsulates the logic for selecting between the `indexRoute` and the
 * child `routes` array
 */
export const resolveChildRoutes = (
	matchedRoute: MatchedRoute
): Promise<Array<PlatformRoute>> =>
	(matchedRoute.match.isExact &&
		(matchedRoute.route.indexRoute || matchedRoute.route.getIndexRoute)
		? resolveIndexRoute(matchedRoute).then(
				m => (m.route.indexRoute ? [m.route.indexRoute] : [])
			)
		: resolveNestedRoutes(matchedRoute).then(m => m.route.routes || []));

/*
 * munge a route's 'relative' `path` with the full matchedPath
 */
const routePath = (route: PlatformRoute, matchedPath: string): string =>
	`${matchedPath}${route.path || ''}`.replace('//', '/');

/*
 * find all routes from a given array of route config objects that match the
 * supplied `url`
 *
 * this function matches the signature of `react-router-config`'s `matchRoutes`
 * function, but interprets all `route.path` settings as nested
 *
 * @see {@link https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config#matchroutesroutes-pathname}
 */
/*
 * Collect the return values of each query functions associated with the matched
 * routes, called with the provided location URL
 *
 * The function returned from calling `matchedRouteQueriesReducer` with a
 * `location` should be used as the callback to an `array.reduce` call.
 */
export const matchedRouteQueriesReducer = (location: URL) => (
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

export const matchRoutes = (
	routes: Array<PlatformRoute> = [],
	url: string = '',
	matchedRoutes: Array<MatchedRoute> = [],
	matchedPath: string = ''
): Promise<Array<MatchedRoute>> => {
	const route = routes.find(r => matchPath(url, routePath(r, matchedPath))); // take the first match
	if (!route) {
		return Promise.resolve(matchedRoutes);
	}

	// add the route and its `match` object to the array of matched routes
	const currentMatchedPath = routePath(route, matchedPath);
	const match = matchPath(url, currentMatchedPath);
	const currentMatchedRoutes = [...matchedRoutes, { route, match }];

	// add any nested route matches
	return resolveChildRoutes({ route, match }).then(
		childRoutes =>
			(childRoutes.length
				? matchRoutes(
						childRoutes,
						url,
						currentMatchedRoutes,
						currentMatchedPath
					)
				: currentMatchedRoutes)
	);
};

/**
 * Populate all async 'getters' of all _matched_ routes
 */
export const getRouteResolver = (
	routes: Array<PlatformRoute>,
	baseUrl: string
) => (location: URL): Promise<Array<MatchedRoute>> => {
	const url = location.pathname.replace(baseUrl, '');
	return matchRoutes(routes, url).then(x => {
		console.log(x);
		return x;
	});
};

export const getMatchedQueries = (location: URL) => (
	matchedRoutes: Array<MatchedRoute>
): Array<Query> =>
	matchedRoutes.reduce(matchedRouteQueriesReducer(location), []);

export const activeRouteQueries = (
	routes: Array<PlatformRoute>,
	baseUrl: string
) => {
	const resolveRoutes = getRouteResolver(routes, baseUrl);
	return (location: URL) =>
		resolveRoutes(location).then(getMatchedQueries(location));
};
