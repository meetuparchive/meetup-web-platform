import React from 'react';
import { connect } from 'react-redux';
import Link from 'react-router/lib/Link';

function mapStateToProps(state, ownProps) {
	console.log('**');
	console.log(ownProps);
	console.log('**');
	return {
		locationProp: ownProps.location || {}
	};
}

/**
 * Logout link component
 * @module LogoutLink
 */
class LogoutLink extends React.Component {
	render() {
		const {
			to,
			locationProp,
			children
		} = this.props;

		console.log('---');
		console.log(to);
		console.log(locationProp);
		console.log('---');

		return (
			<Link
				to={{ pathname: to, query: {logout: true} }}
			>
				{children}
			</Link>
		);
	}
}

LogoutLink.propTypes = {
	to: React.PropTypes.string
};

export default connect(mapStateToProps)(LogoutLink);
