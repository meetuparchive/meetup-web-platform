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
};
type State = ComponentState;

// 'global' cache of resolved components to skip async fetching on repeat renders
const _componentCache = {};

// simple pass through component to use while real component is loading
const Placeholder = ({ children: React$Node }) => <div />;

const keyFromRoute = (route: PlatformRoute): string =>
	(route.getComponent || '').toString();
const componentFromRoute = (route: PlatformRoute): React$ComponentType<*> =>
	route.component || // statically defined component
	_componentCache[keyFromRoute(route)] || // cached getComponent
	Placeholder; // fallback placeholder while getComponent is resolved

/**
 * Route rendering component that uses internal state to keep a reference to the
 * wrapping component. If the `route` prop has a statically defined `component`,
 * it will be used on first render, otherwise it will be resolved using the
 * component 'getter' and the the result will be rendered (and cached).
 */
class AsyncRoute extends React.Component<Props, State> {
	stopLoading: boolean = false;
	state = {
		component: componentFromRoute(this.props.route),
	};
	static getDerivedStateFromProps(props: Props, state: State) {
		const component = componentFromRoute(props.route);
		if (state.component === component) {
			return null;
		}
		return { component };
	}
	componentDidMount() {
		this.resolveComponent();
	}
	componentDidUpdate() {
		this.resolveComponent();
	}
	componentWillUnmount() {
		this.stopLoading = true;
	}

	resolveComponent() {
		const { route } = this.props;
		if (this.state.component !== Placeholder || !route.getComponent) {
			// already resolved
			return;
		}
		const key = keyFromRoute(route);
		const cached = _componentCache[key];
		if (cached) {
			// something has been cached for this - no need to fetch
			if (this.state.component !== cached) {
				this.setState({ component: cached });
			}
			return;
		}
		_componentCache[key] === Placeholder;
		// not cached yet - go get it
		route.getComponent().then(component => {
			// now cache it
			_componentCache[key] = component;
			// and set it to render if this route is still mounted and not already in sync
			if (this.stopLoading || this.state.component === component) {
				return;
			}
			this.setState({ component });
		});
	}
	render() {
		const { match, route, ...props } = this.props;

		const Component = this.state.component;
		const childRoutes = getMatchedChildRoutes({ match, route });
		const params = decodeParams(match.params); // React Router encodes the URL params - send decoded values to component

		return (
			<Component {...props} route={route} match={{ ...match, params }}>
				{childRoutes.length > 0 && (
					<RouteLayout routes={childRoutes} matchedPath={match.path} />
				)}
			</Component>
		);
	}
}

export default AsyncRoute;
