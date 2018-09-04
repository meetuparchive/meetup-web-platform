// @flow
import React from 'react';
import withRouter from 'react-router-dom/withRouter';
import type { Location, ContextRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { locationChange } from './routeActionCreators';

type Props = {
	locationChange: Location => FluxStandardAction,
	...ContextRouter,
};

const mapDispatchToProps = { locationChange };

/*
 * This container connects route changes to Redux actions. When the router
 * inject new props, the container determines whether or not to dispatch a
 * 'locationChange' action
 *
 * In order to prevent data fetches when the hash changes, we only compare
 * the new pathname and querystring with the current pathname and querystring
 */
export class SyncContainer extends React.Component<Props> {
	componentDidUpdate(prevProps: Props) {
		const { history, location, locationChange } = this.props;
		const isPathChange = prevProps.location.pathname !== location.pathname;
		const isSearchChange = prevProps.location.search !== location.search;
		if (isPathChange || isSearchChange) {
			locationChange(location);
			if (history.action === 'PUSH' && isPathChange) {
				// new page - scroll to top
				window.scrollTo(0, 0);
			}
		}
	}
	render() {
		return this.props.children;
	}
}

export default connect(null, mapDispatchToProps)(withRouter(SyncContainer));
