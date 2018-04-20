// @flow
export const decodeParams = (params: { [string]: string }): Params =>
	Object.keys(params).reduce((decodedParams, key) => {
		if (typeof params[key] !== 'undefined') {
			// skip 'undefined' values that cannot be encoded (null is okay)
			decodedParams[key] = params[key] && decodeURI(params[key]);
		}
		return decodedParams;
	}, {});

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
	const routeQueryFns =
		route.query instanceof Array ? route.query : [route.query];

	// call the query functions with non-url-encoded params
	const params = decodeParams(match.params);
	const routeQueries = routeQueryFns
		.map(queryFn => queryFn({ ...match, location, params }))
		.filter(query => query);

	return [...queries, ...routeQueries];
};

/*
 * A synchronous, curried interface to derive the query values returned by the
 * query functions of a provided set of routes given a particular location
 */
export const getMatchedQueries = (location: URL) => (
	matchedRoutes: Array<MatchedRoute>
): Array<Query> =>
	matchedRoutes.reduce(_matchedRouteQueriesReducer(location), []);
