import React from 'react';
import PropTypes from 'prop-types';
import StaticRouter from 'react-router-dom/StaticRouter';
import HapiCookieProvider from '@meetup/mwp-cookie/lib/HapiCookieProvider';
import PlatformApp from './shared/PlatformApp';

/**
 * A simple component to wrap the base PlatformApp with a StaticRouter
 */
class ServerApp extends React.Component {
	render() {
		const { request, h, appContext, routerContext, store, routes } = this.props;
		return (
			<StaticRouter
				basename={appContext.basename}
				location={request.raw.req.url}
				context={routerContext}
			>
				<HapiCookieProvider request={request} h={h}>
					<PlatformApp
						appContext={appContext}
						store={store}
						routes={routes}
					/>
				</HapiCookieProvider>
			</StaticRouter>
		);
	}
}

ServerApp.propTypes = {
	routes: PropTypes.array.isRequired,
	store: PropTypes.object.isRequired,
	request: PropTypes.object.isRequired,
	h: PropTypes.object.isRequired,
	routerContext: PropTypes.object.isRequired,
	appContext: PropTypes.object.isRequired,
};
ServerApp.defaultProps = {
	basename: '',
};

export default ServerApp;
