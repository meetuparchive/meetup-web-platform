// @flow
import React from 'react';
import { connect } from 'react-redux';

const mapStateToProps = (state: MWPState) => ({
	requestLanguage: state.config.requestLanguage,
	enableServiceWorker: state.config.enableServiceWorker,
});
type OwnProps = {|
	children: React$Element<*>,
|};
type Props = {
	...OwnProps,
	requestLanguage: string,
	enableServiceWorker: boolean,
};
/*
 * A lifecycle-only component that registers the platform service worker when
 * the component mounts on the client.
 */
class ServiceWorker extends React.Component<Props> {
	componentDidMount() {
		if (
			this.props.enableServiceWorker &&
			navigator.serviceWorker &&
			!window.location.search.includes('__disable_sw') && // opt-in disable SW
			process.env.NODE_ENV === 'production' // sw caching creates confusion in dev
		) {
			navigator.serviceWorker.register(
				`/asset-service-worker.${this.props.requestLanguage}.js`
			); // must serve from root URL path
		}
	}
	render() {
		return this.props.children;
	}
}

export default connect<Props, OwnProps, _, _, _, _>(mapStateToProps)(ServiceWorker);
