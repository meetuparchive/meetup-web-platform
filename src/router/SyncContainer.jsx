import PropTypes from 'prop-types';
import React from 'react';
import withRouter from 'react-router-dom/withRouter';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { locationChange } from '../api-state'; // mwp-api-state

function mapDispatchToProps(dispatch) {
	return {
		dispatchLocationChange: bindActionCreators(locationChange, dispatch),
	};
}

/**
 * @module SyncContainer
 */
export class SyncContainer extends React.Component {
	/**
	 * This container connects route changes to Redux actions. When the router
	 * inject new props, the container determines whether or not to dispatch a
	 * 'locationChange' action
	 * 
	 * In order to prevent data fetches when the hash changes, we only compare
	 * the new pathname and querystring with the current pathname and querystring
	 * 
	 * @return {undefined} side effect only - dispatch
	 */
	componentWillReceiveProps({ location, history }) {
		if (
			location.pathname !== this.props.location.pathname ||
			location.search !== this.props.location.search
		) {
			this.props.dispatchLocationChange(location);
			if (history.action === 'PUSH') {
				// new navigation - scroll to top
				window.scrollTo(0, 0);
			}
			// eventually we might want to try setting up some scroll logic for 'POP'
			// events (back button) to re-set the previous scroll position
		}
	}
	/**
	 * @return {Function} React element
	 */
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

export default connect(null, mapDispatchToProps)(withRouter(SyncContainer));
