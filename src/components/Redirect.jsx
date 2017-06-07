// @flow
import React from 'react';
import withSideEffect from 'react-side-effect';
import RouterRedirect from 'react-router-dom/Redirect';

const testForExternal = (to: RouterTo): boolean => {
	if (to instanceof URL) {
		return true;
	}
	if (typeof to === 'string') {
		return to.startsWith('http');
	}
	return false; // not external - this must be a React Router 'location'
};

type RouterTo = string | LocationShape | URL;
type RedirectProps = {
	to: RouterTo,
	push?: boolean,
};

/*
 * A routing component that, when rendered, will redirect the application to
 * another internal route _or_ external URL. On the server, the redirect will
 * be handled with a 302 redirect HTTP response to the browser. On the client,
 * `window.location.replace` will be used for external URLs, but React Router
 * will respect a `push: false` property to decide whether to push or replace
 * ``window.history` state.
 *
 * Strings, location objects, and URL objects are all supported in the `to`
 * prop, but location objects will _only_ be treated as internal routes, and URL
 * objects will _only_ be treated as external URLs.
 *
 * Example:
 *
 * ```
 * // internal route, string URL
 * <Router to='/foo/bar' />
 * // internal route, location object
 * <Router to={{pathname: '/foo/bar', search: '?foo=bar', hash: '#thing'}} />
 *
 * // external URL, string URL
 * <Router to='http://example.com' />
 * // external URL, URL object
 * <Router to={new URL('http://example.com')} />
 * ```
 */
class Redirect extends React.Component {
	props: RedirectProps;
	render() {
		const { to, push } = this.props;
		if (to instanceof URL || testForExternal(to)) {
			return null;
		}
		return <RouterRedirect to={to} push={push} />;
	}
}

const reducePropsToState = (propsList: Array<RedirectProps>): ?string => {
	const { to } = propsList.pop();
	if (to instanceof URL) {
		// return the external URL as a string
		return to.toString();
	}
	if (!testForExternal(to) || typeof to !== 'string') {
		// no external URL string
		return undefined;
	}
	return to;
};

const handleStateChangeOnClient = (to: RouterTo) => {
	if (!testForExternal(to)) {
		// 'internal' links will be handled by React Router
		return;
	}
	window.location.replace(to);
};

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
	Redirect
);
