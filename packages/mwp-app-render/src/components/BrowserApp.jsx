import React from 'react';
import PropTypes from 'prop-types';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import PlatformApp from './shared/PlatformApp';
import initClickTracking from 'mwp-tracking-plugin/lib/util/browserInit';

/**
 * A simple component to wrap the base PlatformApp with the BrowserRouter
 */
class BrowserApp extends React.Component {
	componentDidMount() {
		initClickTracking();
	}
	render() {
		const { basename, store, routes } = this.props;
		return (
			<BrowserRouter basename={basename}>
				<PlatformApp store={store} routes={routes} />
			</BrowserRouter>
		);
	}
}

BrowserApp.propTypes = {
	routes: PropTypes.array.isRequired,
	store: PropTypes.object.isRequired,
	basename: PropTypes.string.isRequired,
};
BrowserApp.defaultProps = {
	basename: '',
};

export default BrowserApp;
