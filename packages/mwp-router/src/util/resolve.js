// @flow

/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */

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

// resolve the `component` property
const resolveComponent = (
	route: PlatformRoute
): Promise<React$ComponentType<*>> => {
	if (route.component) {
		return Promise.resolve(route.component);
	}
	return route.getComponent();
};

/*
 * Resolve the current route and all children
 * 
 * *Note* DO NOT USE THIS IN THE BROWSER - it will eagerly resolve all async
 * components
 */
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
