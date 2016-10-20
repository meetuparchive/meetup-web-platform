import React from 'react';

/**
 * @module APIQuery
 */
class APIQuery extends React.Component {
	componentWillMount() {
		this.context.addQuery(this.props.query);
	}
	/*
	 * componentDidUnmount() {
	 * 	this.context.removeQuery(this.props.query);
	 * }
	 */
	render() {
		return React.Children.only(this.props.children);
	}
}

APIQuery.contextTypes = {
	addQuery: React.PropTypes.func
};

export default APIQuery;

