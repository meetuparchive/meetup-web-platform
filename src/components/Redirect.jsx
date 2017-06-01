// @flow
import React from 'react';
import withSideEffect from 'react-side-effect';
import RouterRedirect from 'react-router-dom/Redirect';

type RouterTo = string | LocationShape | URL;
type RedirectProps = {
	to: RouterTo,
	push?: boolean,
};
const testForExternal = (to: RouterTo): boolean => {
	if (to instanceof URL) {
		return true;
	}
	if (typeof to === 'string') {
		return to.startsWith('http');
	}
	return false; // this is a React Router 'location'
};

class Redirect extends React.Component {
	props: RedirectProps;
	render() {
		const { to, push } = this.props;
		if (to instanceof URL || testForExternal(to)) {
			return null;
		}
		return <RouterRedirect to={to} push={push} />;
	}
}

const reducePropsToState = (propsList: Array<{ to: RouterTo }>): ?string => {
	const { to } = propsList.pop();
	if (to instanceof URL) {
		return to.toString();
	}
	if (!testForExternal(to) || typeof to !== 'string') {
		return undefined;
	}
	return to;
};

const handleStateChangeOnClient = (to: RouterTo) => {
	if (!testForExternal(to)) {
		// 'internal' links will be handled by React Router
		return;
	}
	window.location.replace(to);
};

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
	Redirect
);
