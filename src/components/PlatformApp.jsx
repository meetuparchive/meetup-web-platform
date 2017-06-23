import React from 'react';
import { Provider } from 'react-redux';
import SyncContainer from './SyncContainer';
import ServiceWorker from './ServiceWorker';
import RouteLayout from './RouteLayout';

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
