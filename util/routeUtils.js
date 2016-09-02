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
	return routes
		.filter(({ query }) => query)  // only get routes with queries
		.reduce((queries, { query }) => {  // assemble into one array of queries
			const routeQueries = query instanceof Array ? query : [query];
			return queries.concat(routeQueries);
		}, [])
		.map(query => query({ location, params }));  // call the query function
}

function addParamsToMatch(newParams) {
	return function(match) {
		const [redirectLocation, renderProps] = match;
		const params = renderProps.params || {};
		renderProps.params = { ...params, ...newParams };
		return [redirectLocation, renderProps];
	};
}

export function activeRouteQueries$(routes, { location, auth }) {
	return match$({ routes, location })
		.map(addParamsToMatch({ auth }))  // queries may need to know logged-in user
		.map(getActiveRouteQueries);  // collect queries from active routes
}

