import PropTypes from 'prop-types';
import React from 'react';
import withRouter from 'react-router-dom/withRouter';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { locationChange } from '../actions/syncActionCreators';

const mapStateToProps = state => ({ localeCode: state.config.localeCode });
const mapDispatchToProps = dispatch => ({
	dispatchLocationChange: bindActionCreators(locationChange, dispatch),
});

/*
 * 1. Register the asset-caching service worker to sync static assets
 * 2. Connect route changes to Redux actions. When the router
 *    injects new props, the container determines whether or not to dispatch a
 *    'locationChange' action
 */
export class SyncContainer extends React.Component {
	componentDidMount() {
		if (
			navigator.serviceWorker &&
			process.env.NODE_ENV === 'production' // sw caching creates confusion in dev
		) {
			navigator.serviceWorker.register(
				`/asset-service-worker.${this.props.localeCode}.js`
			); // must serve from root URL path
		}
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.location !== this.props.location) {
			this.props.dispatchLocationChange(nextProps.location);
			if (nextProps.history.action === 'PUSH') {
				// new navigation - scroll to top
				window.scrollTo(0, 0);
			}
			// eventually we might want to try setting up some scroll logic for 'POP'
			// events (back button) to re-set the previous scroll position
		}
	}
	render() {
		return this.props.children;
	}
}

SyncContainer.propTypes = {
	children: PropTypes.element.isRequired,
	dispatchLocationChange: PropTypes.func.isRequired,
	location: PropTypes.object.isRequired,
	history: PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(
	withRouter(SyncContainer)
);
