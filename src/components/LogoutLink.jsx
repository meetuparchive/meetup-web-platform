import React from 'react';
import Link from 'react-router/lib/Link';

/**
 * Logout link component
 * @module LogoutLink
 */
class LogoutLink extends React.Component {
	getDefaultProps() {
		return {
			to: this.props.location
		};
	}

	render() {
		const {
			to,
			children,
			...other
		} = this.props;

		console.log(this.props.location);
		console.log(to);

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

export default LogoutLink;
