import React from 'react';
import withRouter from 'react-router-dom/withRouter';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { locationChange } from '../actions/syncActionCreators';

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
	 * @return {undefined} side effect only - dispatch
	 */
	componentWillReceiveProps(nextProps) {
		if (nextProps.location !== this.props.location) {
			this.props.dispatchLocationChange(nextProps.location);
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
	children: React.PropTypes.element.isRequired,
	dispatchLocationChange: React.PropTypes.func.isRequired,
	location: React.PropTypes.object.isRequired,
};

export default connect(null, mapDispatchToProps)(
	withRouter(SyncContainer)
);

