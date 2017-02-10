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
	 * This container only cares about routing changes. When the route changes,
	 * it should trigger a LOCATION_SYNC action
	 * @return {undefined} side effect only - dispatch
	 */
	componentWillUpdate() {
		this.props.dispatchLocationChange(this.props.location);
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

export default withRouter(connect(null, mapDispatchToProps)(SyncContainer));

