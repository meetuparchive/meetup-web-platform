/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */
import Rx from 'rxjs';
import match from 'react-router/lib/match';

// Create observable from callback-based `match`
const match$ = Rx.Observable.bindNodeCallback(match);

/**
 * From the renderProps provided by React Router's `match`, collect the results
 * of the query properties associated with currently-active routes
 *
 * @param matchCallbackArgs {Array} redirectLocation(ignored) and renderProps
 * @return {Array} The return values of each active route's query function
 */
function getActiveRouteQueries([ , { routes, location, params }]) {
	const queries = routes
		.filter(({ query }) => query)  // only get routes with queries
		.reduce((queries, { query }) => {  // assemble into one array of queries
			const routeQueries = query instanceof Array ? query : [query];
			return queries.concat(routeQueries);
		}, [])
		.map(query => query({ location, params }));  // call the query function

	return queries;
}

export const activeRouteQueries$ = routes => location =>
	match$({ routes, location })
		.map(getActiveRouteQueries)
		.filter(queries => queries.length);

