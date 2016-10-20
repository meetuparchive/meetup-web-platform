import React from 'react';

/**
 * @module APIQuery
 */
class APIQuery extends React.Component {
	componentDidMount() {
		this.context.addQuery(this.props.query);
	}
	/*
	 * componentDidUnmount() {
	 * 	this.context.removeQuery(this.props.query);
	 * }
	 */
	render() {
		return null;
	}
}

APIQuery.contextTypes = {
	addQuery: React.PropTypes.function
};

export default APIQuery;

