import React from 'react';
import PropTypes from 'prop-types';
import StaticRouter from 'react-router-dom/StaticRouter';
import HapiCookieProvider from '@meetup/mwp-cookie/lib/HapiCookieProvider';
import PlatformApp from './shared/PlatformApp';
import ApolloProvider from './ApolloProvider';

/**
 * A simple component to wrap the base PlatformApp with a StaticRouter
 */
class ServerApp extends React.Component {
	render() {
		const { request, h, appContext, routerContext, store, routes } = this.props;
		const location = {
			pathname: request.url.pathname,
			search: request.url.search,
			hash: request.url.hash,
		};
		return (
			<StaticRouter
				basename={appContext.basename}
				location={location}
				context={routerContext}
			>
				<HapiCookieProvider request={request} h={h}>
					<ApolloProvider isServer>
						<PlatformApp
							appContext={appContext}
							store={store}
							routes={routes}
						/>
					</ApolloProvider>
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
