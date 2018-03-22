import PropTypes from 'prop-types';
import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';
import AsyncRoute from './AsyncRoute';

/**
 * @class RouteLayout
 */
class RouteLayout extends React.Component {
	render() {
		const { routes, matchedPath = '/', childProps } = this.props;

		return (
			<Switch>
				{routes.map((route, i) => {
					const path =
						matchedPath === '/' // root path, no need to prepend
							? route.path
							: `${matchedPath}${route.path || ''}`;

					return (
						<Route
							key={i}
							path={path}
							exact={route.exact || false}
							strict={route.strict || false}
							render={props =>
								<AsyncRoute
									{...props}
									{...childProps}
									route={route}
								/>}
						/>
					);
				})}
			</Switch>
		);
	}
}

RouteLayout.propTypes = {
	routes: PropTypes.arrayOf(PropTypes.object).isRequired,
	childProps: PropTypes.object,
	matchedPath: PropTypes.string,
};

export default RouteLayout;
