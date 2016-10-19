import React from 'react';
import { connect } from 'react-redux';
import { apiRequest } from '../actions/syncActionCreators';

function mapStateToProps(state) {
	return {
		location: state.router
	};
}

const mapDispatchToProps = {
	apiRequest
};

/**
 * @module APIQuery
 */
class APIQuery extends React.Component {
	onComponentDidMount() {
		this.props.apiRequest(this.props.location);
	}
	render() {
		return this.props.children;
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(APIQuery);

