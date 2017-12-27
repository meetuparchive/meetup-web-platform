// @flow
import React from 'react';
import type { RouterHistory } from 'react-router-dom';
import { decodeParams, getChildRoutes } from './util';
import RouteLayout from './RouteLayout';

type Props = {
	route: PlatformRoute,
	match: Match,
	location: URL,
	history: RouterHistory,
};
type State = {
	childRoutes: Array<PlatformRoute>,
	_routesCache: { [string]: Array<PlatformRoute> },
};

/**
 * Route rendering component that will render nested routes asynchronously
 * The nested routes are cached so that the async data is not re-requested
 * each time a route is re-rendered.
 */
class AsyncRoute extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		const { match, route } = props;
		const childRoutes = getChildRoutes({ match, route });
		this.state = {
			childRoutes,
			_routesCache: {},
		};
	}
	updateChildRoutes(childRoutes: Array<PlatformRoute>, key: string) {
		this.setState(state => ({
			childRoutes,
			_routesCache: {
				...state._routesCache,
				[key]: childRoutes,
			},
		}));
	}
	resolveAsyncChildRoutes(
		resolver: () => Promise<Array<PlatformRoute> | PlatformRoute>
	) {
		const key = resolver.toString();
		// async route - check for cache keyed by stringified load function
		const cached = this.state._routesCache[key];
		if (cached) {
			this.updateChildRoutes(cached, key);
			return;
		}
		resolver().then(routes => {
			routes = routes instanceof Array ? routes : [routes];
			this.updateChildRoutes(routes, key);
		});
		return;
	}
	/*
	 * New props may correspond to a route change. If so, this function populates
	 * this.state.childRoutes to correspond to the indexRoute or nested routes
	 * defined by the new route
	 */
	componentWillReceiveProps(nextProps: Props) {
		const { match, route } = nextProps;
		if (route === this.props.route && match === this.props.match) {
			return;
		}
		const childRoutes = getChildRoutes({ match, route });
		this.setState(state => ({ childRoutes }));
		if (childRoutes.length) {
			return;
		}
		if (match.isExact && route.getIndexRoute) {
			this.resolveAsyncChildRoutes(route.getIndexRoute);
			return;
		}

		if (route.getNestedRoutes) {
			this.resolveAsyncChildRoutes(route.getNestedRoutes);
		}
		return;
	}
	render() {
		const { route, match, ...props } = this.props;
		const { childRoutes } = this.state;
		// React Router encodes the URL params - send decoded values to component
		const params = decodeParams(match.params);
		const Component = route.component;

		return (
			<Component {...props} route={route} match={{ ...match, params }}>
				{childRoutes.length > 0 &&
					<RouteLayout
						routes={childRoutes}
						matchedPath={match.path}
					/>}
			</Component>
		);
	}
}

export default AsyncRoute;
