import React from 'react';
import withSideEffect from 'react-side-effect';

/**
 * Use this component as a wrapper for your '403 Forbidden' UI when you determine
 * the user doesn't have sufficient permissions to view the requested route.
 * Note that only one child is allowed for this component since it does not
 * provide any rendered output itself.
 */
class Forbidden extends React.Component {
	render() {
		if (this.props.children) {
			return React.Children.only(this.props.children);
		}
		return null;
	}
}

function reducePropsToState(propsList) {
	if (!propsList.length) {
		return;
	}
	return 403;
}

function handleStateChangeOnClient(code) {}

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
	Forbidden
);
