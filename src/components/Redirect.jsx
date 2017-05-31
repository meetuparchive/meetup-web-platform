// @flow
import React from 'react';
import withSideEffect from 'react-side-effect';
import RouterRedirect from 'react-router-dom/Redirect';

const testForExternal = (to: string) => to.startsWith('http');

type RedirectProps = {
	to: string,
};
class Redirect extends React.Component {
	props: RedirectProps;
	render() {
		const { to } = this.props;
		if (testForExternal(to)) {
			return null;
		}
		return <RouterRedirect to={to} />;
	}
}

const reducePropsToState = (propsList: Array<RedirectProps>) =>
	propsList.pop().to;

const handleStateChangeOnClient = (to: string) => {
	if (!testForExternal(to)) {
		// 'internal' links will be handled by React Router
		return;
	}
	window.location.replace(to);
};

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
	Redirect
);
