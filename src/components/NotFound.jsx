import React from 'react';
import withSideEffect from 'react-side-effect';

/**
 * Use this component as a wrapper for your 'not found' UI when the API returns
 * no data
 *
 * Note that only one child is allowed for this component since it does not
 * provide any rendered output itself
 */
class NotFound extends React.Component {
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
	return 404;
}

function handleStateChangeOnClient(code) {}

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
	NotFound
);
