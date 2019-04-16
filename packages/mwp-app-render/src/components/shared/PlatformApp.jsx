import React from 'react';
import { Provider } from 'react-redux';
import { SyncContainer, RouteLayout } from 'mwp-router';
import ServiceWorker from './ServiceWorker';

// Special context provider for config values supplied by server
export const AppContext = React.createContext();

const PlatformApp = props => (
	<AppContext.Provider value={props.context}>
		<Provider store={props.store}>
			<ServiceWorker>
				<SyncContainer>
					<RouteLayout routes={props.routes} />
				</SyncContainer>
			</ServiceWorker>
		</Provider>
	</AppContext.Provider>
);

export default PlatformApp;
