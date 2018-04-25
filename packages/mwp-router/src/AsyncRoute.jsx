// @flow
import React from 'react';
import type { RouterHistory } from 'react-router-dom';
import { decodeParams, getMatchedChildRoutes } from './util';
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
type State = ComponentState;

// simple pass through component to use while real component is loading
const PassThrough = (children: React$Node) => <div />;

// Helper to set rendering component once resolved, as well as update cache
const getComponentStateSetter = (key: string) => (
	component: React$ComponentType<*>
) => (state: State): ComponentState => ({
	component,
	_componentCache: { ...state._componentCache, [key]: component },
});

/**
 * Route rendering component that uses internal state to keep a reference to the
 * wrapping component. If the `route` prop has a statically defined `component`,
 * it will be used on first render, otherwise it will be resolved using the
 * component 'getter' and the the result will be rendered (and cached).
 */
class AsyncRoute extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		const route = props.route;

		this.state = {
			component: route.component || PassThrough,
			_componentCache: {},
		};
		if (route.getComponent) {
			this.resolveComponent(route.getComponent);
		}
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
	 * New props may correspond to a route change. If so, this function sets the
	 * component to render
	 */
	componentWillReceiveProps(nextProps: Props) {
		const { match, route } = nextProps;
		if (route === this.props.route && match === this.props.match) {
			return; // no new route, just re-render normally
		}

		if (route.component) {
			this.setState(state => ({ component: route.component }));
			return;
		}

		this.setState(state => ({ component: PassThrough }));
		// Component needs to be resolved - just render children for now
		this.resolveComponent(route.getComponent);
	}

	render() {
		const { match, route, ...props } = this.props;

		const Component = this.state.component;
		const childRoutes = getMatchedChildRoutes({ match, route });
		const params = decodeParams(match.params); // React Router encodes the URL params - send decoded values to component

		return (
			<Component {...props} route={route} match={{ ...match, params }}>
				{childRoutes.length > 0 &&
					<RouteLayout routes={childRoutes} matchedPath={match.path} />}
			</Component>
		);
	}
}

export default AsyncRoute;
