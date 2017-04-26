import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';

import { decodeParams, getNestedRoutes } from '../util/routeUtils';

const Empty = () => <div></div>;
/**
 * route rendering component
 */
class AsyncRoute extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			component: props.route.component || Empty,
		};
	}
	componentDidMount() {
		if (!this.props.route.component) {
			this.props.route.load().then(component => this.setState({ component }));
		}
	}
	render() {
		const { route, match } = this.props;
		// React Router will automatically encode the URL params - we want the
		// decoded values in the component
		match.params = decodeParams(match.params);
		const nestedRoutes = getNestedRoutes({ route, match });
		return (
			<this.state.component {...this.props}>
				{nestedRoutes &&
					<RouteLayout routes={nestedRoutes} matchedPath={match.path} />
				}
			</this.state.component>
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

