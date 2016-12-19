import React from 'react';
import Link from 'react-router/lib/Link';

/**
 * Logout link component
 * @module LogoutLink
 */
class LogoutLink extends React.Component {
	render() {
		const {
			to,
			children,
			...other
		} = this.props;

		const { router } = this.context;
		console.log(router);

		// const path = typeof to !== 'undefined' ? to : location;

		return (
			<Link
				to={{ pathname: to, query: {logout: true} }}
				{...other}
			>
				{children}
			</Link>
		);
	}
}

LogoutLink.propTypes = {
	to: React.PropTypes.string
};

LogoutLink.contextTypes = {
	router: React.PropTypes.object
};

export default LogoutLink;
