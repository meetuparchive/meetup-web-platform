import React from 'react';
import PropTypes from 'prop-types';
import withRouter from 'react-router-dom/withRouter';

class SystemMessage extends React.Component {
	componentWillReceiveProps({ location }) {
		// look for new location.search (querystring) and check for sysmsg param
		if (location.search !== this.props.location.search) {
			const newParams = new URLSearchParams(location.search);
			const sysmsg = newParams.get('sysmsg');
			if (sysmsg && sysmsg !== this.state.sysmsg) {
				this.setState(() => ({ sysmsg }));
			}
		}
	}
	render() {
		const { sysMessages } = this.props;
		const { sysmsg } = this.state;
		return sysMessages[sysmsg];
	}
}

SystemMessage.propTypes = {
	location: PropTypes.object.isRequired, // provided by withRouter
	sysMessages: PropTypes.object.isRequired,
};
export default withRouter(SystemMessage);
