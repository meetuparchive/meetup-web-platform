import React from 'react';
import PropTypes from 'prop-types';
import StaticRouter from 'react-router-dom/StaticRouter';
import PlatformApp from './shared/PlatformApp';

/**
 * A simple component to wrap the base PlatformApp with a StaticRouter
 */
class ServerApp extends React.Component {
	render() {
		const { appContext, location, routerContext, store, routes } = this.props;
		return (
			<StaticRouter
				basename={appContext.basename}
				location={location}
				context={routerContext}
			>
				<PlatformApp appContext={appContext} store={store} routes={routes} />
			</StaticRouter>
		);
	}
}

ServerApp.propTypes = {
	routes: PropTypes.array.isRequired,
	store: PropTypes.object.isRequired,
	location: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
	routerContext: PropTypes.object.isRequired,
	appContext: PropTypes.object.isRequired,
};
ServerApp.defaultProps = {
	basename: '',
};

export default ServerApp;
