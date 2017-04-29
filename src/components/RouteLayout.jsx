import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';

import { decodeParams, getNestedRoutes } from '../util/routeUtils';

const Empty = () => <div></div>;
const Loading = () => <div></div>;
/**
 * route rendering component
 */
class AsyncRoute extends React.Component {
	constructor(props) {
		super(props);
		const component = props.route.component || Empty;
		this.state = {
			component,
			_cache: [component],
		};
	}
	componentWillReceiveProps(nextProps) {
		const { component, load } = nextProps.route;
		if (component) {
			this.setState(state => ({ component }));
			return;
		}
		// async route - check for cache keyed by load function
		const cached = this.state._cache[load.toString()];
		if (cached) {
			this.setState(state => ({ component: cached }));
			return;
		}

		// load async route
		this.setState(state => ({ component: Loading }));
		load().then(component => {
			this.setState({ component });
		});
	}
	componentDidMount() {
		if (this.props.route.load) {
			this.props.route.load().then(component => this.setState({ component }));
		}
	}
	render() {
		const { route, match } = this.props;
		// React Router will automatically encode the URL params - we want the
		// decoded values in the component
		match.params = decodeParams(match.params);
		const nestedRoutes = getNestedRoutes({ route, match });
		const Component = this.state.component;
		return (
			<Component {...this.props}>
				{nestedRoutes &&
					<RouteLayout routes={nestedRoutes} matchedPath={match.path} />
				}
			</Component>
		);

	}
}

const RouteWithSubRoutes = route => {
	if (!route.component && !route.load) {
		throw new Error(`route for path ${JSON.stringify(route.path)} must have a 'component' property`);
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
		const {
			routes,
			matchedPath='/'
		} = this.props;

		return (
			<Switch>
				{routes.map((route, i) => {
					const path = matchedPath === '/' ?  // root path, no need to prepend
						route.path :
						`${matchedPath}${route.path || ''}`;

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

