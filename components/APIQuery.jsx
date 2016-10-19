import React from 'react';
import { connect } from 'react-redux';
import withSideEffect from 'react-side-effect';
import { apiRequest } from '../actions/syncActionCreators';

function mapStateToProps(state) {
	return {
		location: state.router
	};
}

const mapDispatchToProps = {
	apiRequest
};

function reducePropsToState(propsList) {
	return propsList.reduce((allQueries, props) => {
		const {
			query,
			location,
			apiRequest,
		} = props;
		const queries = query instanceof Array ? query : [query];
		return {
			apiRequest,
			queries: [ ...allQueries.queries, ...queries.map(q => q(location)) ]
		};
	}, { queries: [] });
}

function handleStateChangeOnClient({ apiRequest, queries }) {
	apiRequest(queries);
}

/**
 * @module APIQuery
 */
class APIQuery extends React.Component {
	render() {
		return null;
	}
}

const connectedAPIQuery = connect(mapStateToProps, mapDispatchToProps)(APIQuery);
export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(connectedAPIQuery);

