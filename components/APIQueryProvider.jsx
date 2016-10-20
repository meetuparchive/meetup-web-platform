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

let queries = [];

/**
 * @module APIQueryProvider
 */
class APIQueryProvider extends React.Component {
	static rewind() {
		const recordedQueries = queries;
		queries = [];
		return recordedQueries;
	}
	getChildContext() {
		return {
			addQuery: query => {
				const newQueries = query instanceof Array ? query : [query];
				queries = [...queries, ...newQueries];
			}
		};
	}
	componentDidUpdate(prevProps) {
		// all components ready, so dispatch the collected queries
		if (prevProps.location.key !== this.props.location.key && queries.length) {
			this.props.apiRequest(queries.map(query => query(this.props.location)));
			queries = [];
		}
	}
	render() {
		return React.Children.only(this.props.children);
	}
}

APIQueryProvider.childContextTypes = {
	addQuery: React.PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(APIQueryProvider);

