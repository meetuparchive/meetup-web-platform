import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';

const RouteWithSubRoutes = route => {
	if (!route.component) {
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
			render={props => {
				const nestedRoutes = props.match.isExact && route.indexRoute ?
					[route.indexRoute] :   // only render index route
					route.routes;          // pass along any defined nested routes
				return (
					<route.component {...props}>
						{nestedRoutes &&
							<RouteLayout routes={nestedRoutes} currentPath={props.match.path} />
						}
					</route.component>
				);
			}}
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
			currentPath='/'
		} = this.props;

		return (
			<Switch>
				{routes.map((route, i) => {
					const path = currentPath === '/' ?  // root path, no need to prepend
						route.path :
						`${currentPath}${route.path || ''}`;

					return <RouteWithSubRoutes key={i} {...route} path={path} />;
				})}
			</Switch>
		);
	}
}

RouteLayout.propTypes = {
	routes: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
	currentPath: React.PropTypes.string,
};

export default RouteLayout;

