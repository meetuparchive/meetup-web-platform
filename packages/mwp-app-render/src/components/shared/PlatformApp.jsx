import React from 'react';
import { Provider } from 'react-redux';
import { SyncContainer, RouteLayout } from 'mwp-router';
import ServiceWorker from './ServiceWorker';

/**
 * @module PlatformApp
 */
class PlatformApp extends React.Component {
	render() {
		const { store, routes } = this.props;
		return (
			<Provider store={store}>
				<ServiceWorker>
					<SyncContainer>
						<RouteLayout routes={routes} />
					</SyncContainer>
				</ServiceWorker>
			</Provider>
		);
	}
}

export default PlatformApp;
