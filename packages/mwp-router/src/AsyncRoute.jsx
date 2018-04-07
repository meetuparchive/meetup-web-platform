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
type ComponentState = {
	component: React$ComponentType<*>,
	_componentCache: { [string]: React$ComponentType<*> },
};
type State = ComponentState & {
	childRoutes: Array<PlatformRoute>,
	_routesCache: { [string]: Array<PlatformRoute> },
};

const PassThrough = (children: React$Node) => React.Children.only(children);

const getLogDeprecate = (message: string) => {
	const calledForKeys = {};
	return (key: string): void => {
		if (process.env.NODE === 'production' || calledForKeys[key]) {
			return;
		}
		console.error('DEPRECATED:', key, message);
		calledForKeys[key] = true;
	};
};

const logAsyncChildDeprecate = getLogDeprecate(
	'uses deprecated async routing function'
);

const getComponentStateSetter = (key: string) => (
	component: React$ComponentType<*>
) => (state: State): ComponentState => ({
	component,
	_componentCache: { ...state._componentCache, [key]: component },
});

/**
 * Route rendering component that will render nested routes asynchronously
 * The nested routes are cached so that the async data is not re-requested
 * each time a route is re-rendered.
 */
class AsyncRoute extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		const route: PlatformRoute = props.route;
		const { match } = props;
		const childRoutes = getChildRoutes({ match, route });

		this.state = {
			component: route.component || PassThrough,
			_componentCache: {},
			childRoutes, // DEPRECATED
			_routesCache: {}, // DEPRECATED
		};
	}
	/* DEPRECATED */
	updateChildRoutes(childRoutes: Array<PlatformRoute>, key: string) {
		this.setState(state => ({
			childRoutes,
			_routesCache: {
				...state._routesCache,
				[key]: childRoutes,
			},
		}));
	}
	/* DEPRECATED */
	resolveAsyncChildRoutes(
		resolver: () => Promise<Array<PlatformRoute> | PlatformRoute>
	) {
		const key = resolver.toString();
		logAsyncChildDeprecate(key);
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
	 * Given a component-resolving function, update this.state.component with
	 * the resolved value - set/get cached reference as necessary
	 */
	resolveComponent(resolver: () => Promise<React$ComponentType<*>>) {
		const key = resolver.toString();
		const cached = this.state._componentCache[key];
		if (cached) {
			this.setState({ component: cached });
			return;
		}
		resolver()
			.then(getComponentStateSetter(key))
			.then(setter => this.setState(setter));
	}

	/*
	 * New props may correspond to a route change. If so, this function populates
	 * this.state.childRoutes to correspond to the indexRoute or nested routes
	 * defined by the new route
	 */
	componentWillReceiveProps(nextProps: Props) {
		const { match, route } = nextProps;
		if (route === this.props.route && match === this.props.match) {
			// no new route, just re-render normally
			return;
		}

		// route change - get synchronously defined routes and component, if any
		const childRoutes = getChildRoutes({ match, route });
		if (route.component) {
			this.setState(state => ({ component: route.component, childRoutes }));

			// bail if static child routes found - no need to resolve
			// anything else
			// DEPRECATED - once async children are removed, we _always_ return here
			if (childRoutes.length) {
				return;
			}

			// if no static child routes found, need to resolve them from Promises, if any
			// DEPRECATED
			if (match.isExact && route.getIndexRoute) {
				this.resolveAsyncChildRoutes(route.getIndexRoute);
				return;
			}
			// DEPRECATED
			if (route.getNestedRoutes) {
				this.resolveAsyncChildRoutes(
					route.getNestedRoutes || (() => Promise.resolve([]))
				);
			}
			return;
		}

		// Component needs to be resolved - just render children for now
		this.setState(state => ({ component: PassThrough, childRoutes }));

		// resolve component async
		if (route.getComponent) {
			this.resolveComponent(route.getComponent);
		}
	}

	render() {
		const { route, match, ...props } = this.props;
		const Component: React$ComponentType<*> = this.state.component;
		const { childRoutes } = this.state;
		// React Router encodes the URL params - send decoded values to component
		const params = decodeParams(match.params);

		return (
			<Component {...props} route={route} match={{ ...match, params }}>
				{childRoutes.length > 0 &&
					<RouteLayout routes={childRoutes} matchedPath={match.path} />}
			</Component>
		);
	}
}

export default AsyncRoute;
