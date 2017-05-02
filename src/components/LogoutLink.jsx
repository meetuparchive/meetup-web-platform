import React from 'react';
import Link from 'react-router-dom/Link';

/**
 * Logout link component
 * @module LogoutLink
 */
class LogoutLink extends React.Component {
	render() {
		const { to, children } = this.props;

		return (
			<Link to={{ pathname: to, query: { logout: true } }}>
				{children}
			</Link>
		);
	}
}

LogoutLink.propTypes = {
	to: React.PropTypes.string,
};

LogoutLink.defaultProps = {
	to: '/',
};

export default LogoutLink;
