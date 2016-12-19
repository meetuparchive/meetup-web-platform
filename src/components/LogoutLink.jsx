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
			location,
			...other
		} = this.props;

		const path = typeof to !== 'undefined' ? to : location;

		console.log(this.props.location);
		console.log(path);

		return (
			<Link
				to={{ pathname: path, query: {logout: true} }}
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

export default LogoutLink;
