import React from 'react';
import Route from 'react-router/lib/Route';
import makeRootReducer from '../src/reducers/platform';

export const clientFilename = 'client.whatever.js';
export const assetPublicPath = '//whatever';
export const reducer = makeRootReducer();

export const fooPathContent = 'Looking good';
export const FooPathComponent = props => <div>{fooPathContent}</div>;

export const routes = {
	path: '/foo',
	component: FooPathComponent,
	query: () => ({}),
};

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

			</div>
		);
	}
}
