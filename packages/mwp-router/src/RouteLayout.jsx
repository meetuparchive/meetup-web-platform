// @flow
import PropTypes from 'prop-types';
import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';
import AsyncRoute from './AsyncRoute';

type Props = {|
	routes: Array<PlatformRoute>,
	matchedPath: string,
|};
const RouteLayout = (props: Props) => {
	const { routes, matchedPath = '/' } = props;

	return (
		<Switch>
			{routes.map(route => {
				const path =
					matchedPath === '/' // root path, no need to prepend
						? route.path
						: `${matchedPath}${route.path || ''}`;

				return (
					<Route
						key={`${path || 'empty'}-${route.exact ? 'exact' : 'false'}`}
						path={path}
						exact={route.exact || false}
						strict={route.strict || false}
						render={props => <AsyncRoute {...props} route={route} />}
					/>
				);
			})}
		</Switch>
	);
};

RouteLayout.propTypes = {
	routes: PropTypes.arrayOf(PropTypes.object).isRequired,
	matchedPath: PropTypes.string,
};

export default RouteLayout;
