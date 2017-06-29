// @flow
import React from 'react';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
	localeCode: state.config.localeCode,
	activateSW: state.config.activateSW,
});

/*
 * A lifecycle-only component that registers the platform service worker when
 * the component mounts on the client.
 */
class ServiceWorker extends React.Component {
	props: {
		localeCode: string,
		activateSW: boolean,
		children: React$Element<*>,
	};
	componentDidMount() {
		if (
			this.props.activateSW &&
			navigator.serviceWorker &&
			process.env.NODE_ENV === 'production' // sw caching creates confusion in dev
		) {
			navigator.serviceWorker.register(
				`/asset-service-worker.${this.props.localeCode}.js`
			); // must serve from root URL path
		}
	}
	render() {
		return this.props.children;
	}
}

export default connect(mapStateToProps)(ServiceWorker);
