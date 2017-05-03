import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';

import { decodeParams } from '../util/routeUtils';

/**
 * route rendering component
 */
class AsyncRoute extends React.Component {
	constructor(props) {
		super(props);
		const childRoutes = this.getChildRoutes();
		this.state = {
			childRoutes,
			_routesCache: {},
		};
	}
	getChildRoutes() {
		const { route, match } = this.props;
		const useIndex = match.isExact && (route.indexRoute || route.getIndexRoute);
		return useIndex && route.indexRoute
			? [route.indexRoute]
			: route.routes || [];
	}
	updateChildRoutes(childRoutes, key) {
		this.setState(state => ({
			childRoutes,
			_routesCache: {
				...state._routesCache,
				[key]: childRoutes,
			},
		}));
	}
	resolveAsyncChildRoutes(resolver) {
		const key = resolver.toString();
		// async route - check for cache keyed by stringified load function
		const cached = this.state._routesCache[key];
		if (cached) {
			this.setState(state => ({ childRoutes: cached }));
			return;
		}
		resolver().then(routes => {
			routes = routes instanceof Array ? routes : [routes];
			this.updateChildRoutes(routes, key);
		});
		return;
	}
	componentWillReceiveProps(nextProps) {
		const { match, route } = nextProps;
		const useIndex = match.isExact && (route.indexRoute || route.getIndexRoute);
		if (useIndex) {
			this.setState(state => ({
				childRoutes: route.indexRoute ? [route.indexRoute] : [],
			}));
			if (route.getIndexRoute) {
				this.resolveAsyncChildRoutes(route.getIndexRoute);
			}
			return;
		}

		this.setState(state => ({
			childRoutes: route.routes || [],
		}));
		if (route.getNestedRoutes) {
			this.resolveAsyncChildRoutes(route.getNestedRoutes);
		}
		return;
	}
	render() {
		const { route, match } = this.props;
		const { childRoutes } = this.state;
		// React Router will automatically encode the URL params - we want the
		// decoded values in the component
		match.params = decodeParams(match.params);

		const Component = route.component;

		return (
			<Component {...this.props}>
				{childRoutes.length > 0 &&
					<RouteLayout routes={childRoutes} matchedPath={match.path} />}
			</Component>
		);
	}
}

const RouteWithSubRoutes = route => {
	if (!route.component && !route.load) {
		throw new Error(
			`route for path ${JSON.stringify(route.path)} must have a 'component' property`
		);
	}
	if (route.render || route.children) {
		console.warn('route.render and route.children function not supported');
	}
	return (
		<Route
			path={route.path}
			exact={route.exact || false}
			strict={route.strict || false}
			render={props => <AsyncRoute {...props} route={route} />}
		/>
	);
};

/**
 * @module RouteLayout
 */
class RouteLayout extends React.Component {
	render() {
		const { routes, matchedPath = '/' } = this.props;

		return (
			<Switch>
				{routes.map((route, i) => {
					const path = matchedPath === '/' // root path, no need to prepend
						? route.path
						: `${matchedPath}${route.path || ''}`;

					return <RouteWithSubRoutes key={i} {...route} path={path} />;
				})}
			</Switch>
		);
	}
}

RouteLayout.propTypes = {
	routes: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
	matchedPath: React.PropTypes.string,
};

export default RouteLayout;
