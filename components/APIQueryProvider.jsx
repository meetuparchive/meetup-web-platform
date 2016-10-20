import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { apiRequest } from '../actions/syncActionCreators';

function mapStateToProps(state) {
	return {
		location: state.router
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ apiRequest }, dispatch);
}

/**
 * @module APIQueryProvider
 */
class APIQueryProvider extends React.Component {
	constructor(props) {
		super(props);
		this.queries = [];
	}
	getChildContext() {
		return {
			addQuery: query => {
				const newQueries = query instanceof Array ? query : [query];
				this.queries = [...this.queries, ...newQueries];
			}
		};
	}
	componentDidUpdate(prevProps) {
		if (prevProps.location.key !== this.props.location.key) {
			this.props.apiRequest(this.queries);
			this.queries = [];
		}
	}
	render() {
		return React.Children.only(this.props.children);
	}
}

APIQueryProvider.childContextTypes = {
	addQuery: React.PropTypes.function
};

export default connect(mapStateToProps, mapDispatchToProps)(APIQueryProvider);

