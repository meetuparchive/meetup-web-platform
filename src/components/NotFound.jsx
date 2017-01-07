import React from 'react';
import withSideEffect from 'react-side-effect';

/**
 * Use this component as a wrapper for your 'not found' UI when the API returns
 * no data
 */
class NotFound extends React.Component {
	render() {
		return React.Children.only(this.props.children);
	}
}

function reducePropsToState(propsList) {
	if (!propsList.length) {
		return;
	}
	return 404;
}

function handleStateChangeOnClient(code) {
}

export default withSideEffect(
	reducePropsToState,
	handleStateChangeOnClient
)(NotFound);

