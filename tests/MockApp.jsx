import React from 'react';
import Route from 'react-router-dom/Route';
import makeRootReducer from '../src/reducers/platform';
import withRouter from 'react-router-dom/withRouter';

import MockContainer from './MockContainer';

export const clientFilename = 'client.whatever.js';
export const assetPublicPath = '//whatever';
export const reducer = makeRootReducer();

export const routes = [{
	path: '/foo',
	component: MockContainer,
	query: () => ({
		type: 'mock',
		ref: 'foo',
		params: {},
	}),
}];

/**
 * Mock app container to pass to the platform renderer
 */
export class AppContainer extends React.Component {
	/**
	 * @return {Function} React element
	 */
	render() {
		return (
			<div>
				<h1>This be the app</h1>
				<Route exact path='foo' component={MockContainer} />
			</div>
		);
	}
}

export default withRouter(AppContainer);

