import React from 'react';
import PropTypes from 'prop-types';
import withRouter from 'react-router-dom/withRouter';

// determine whether the current querystring matches the specified param and
// optional paramVal
const getIsMatch = ({ location, param, value }) => {
	const params = new URLSearchParams(location.search);
	const paramVal = params.get(param);
	return value ? value === params.get(param) : params.has(param);
};

/*
 * This component conditionally renders its children based on the presence of
 * a particular querystring param (optionally with a specific value)
 * 
 * example:
 * 
 * ```
 * <QueryRoute param='foo' val='bar'>
 *   <div>This will display when '?foo=bar'</div>
 * <QueryRoute>
 * ```
 */
export class QueryRoute extends React.Component {
	constructor(props) {
		super(props);
		this.state = { isMatch: getIsMatch(props) };
	}
	componentWillReceiveProps(newProps) {
		if (newProps.location.search !== this.props.location.search) {
			this.setState(() => ({ isMatch: getIsMatch(newProps) }));
		}
	}
	render() {
		if (!this.state.isMatch) {
			return null;
		}
		return this.props.children;
	}
}

QueryRoute.propTypes = {
	location: PropTypes.object.isRequired, // provided by withRouter
	param: PropTypes.string.isRequired,
	value: PropTypes.string,
};
export default withRouter(QueryRoute);
