// @flow
import React from 'react';
import withSideEffect from 'react-side-effect';
import RouterRedirect from 'react-router-dom/Redirect';
import Route from 'react-router-dom/Route';

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
	permanent?: boolean,
	push?: boolean,
};
type RedirectState = {
	url: string,
	permanent?: boolean,
};

/*
 * A routing component that, when rendered, will redirect the application to
 * another internal route _or_ external URL. On the server, the redirect will
 * be handled with a 301/302 redirect HTTP response to the browser - 301 when
 * the `permanent` prop has been set, 302 otherwise. On the client,
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

 * // internal route, permanent redirect
 * <Router to='/foo/bar' permanent />
 * // external URL, permanent redirect
 * <Router to='http://example.com' permanent />
 * ```
 */
class Redirect extends React.Component {
	props: RedirectProps;
	render() {
		const { to, push, permanent } = this.props;
		if (to instanceof URL || testForExternal(to)) {
			// this is an external URL, so let `withSideEffect` handlers do redirect
			return null;
		}
		// internal route URL - <Route> provides access to the static routing
		// context on the server so we can populate the `permanent` value, and the
		// `<Redirect>` will populate the context `url` value or trigger the
		// `window.location` redirect in the browser
		return (
			<Route
				render={({ staticContext }) => {
					if (staticContext) {
						// populate static context for server-side redirect
						staticContext.permanent = permanent;
					}
					return <RouterRedirect to={to} push={push} />;
				}}
			/>
		);
	}
}

const reducePropsToState = (
	propsList: Array<RedirectProps>
): ?RedirectState => {
	const { to, permanent } = propsList.pop();
	if (to instanceof URL) {
		// return the external URL as a string
		return { url: to.toString(), permanent };
	}
	if (!testForExternal(to) || typeof to !== 'string') {
		// no external URL string
		return undefined;
	}
	return { url: to, permanent };
};

export const handleStateChangeOnClient = (redirect: ?RedirectState) => {
	if (!redirect || !testForExternal(redirect.url)) {
		// 'internal' links will be handled by React Router
		return;
	}
	window.location.replace(redirect.url);
};

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
	Redirect
);
