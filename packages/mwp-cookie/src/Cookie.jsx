// @flow
import withSideEffect from 'react-side-effect';
import jsCookie from 'js-cookie';
import type { CookieOptions } from 'js-cookie';

// subset of HapiServerStateCookieOptions (see flow-typed libdef) that can be
// used to supply cookie config opts to Hapi `h.state()` and js-cookie `Cookie.set()`
type CookieProps = CookieOpts & {
	children?: string,
	name: string,
};
const defaults = {
	path: '/',
	domain: '.meetup.com',
	isSecure: true,
	isSameSite: false,
};

/*
 * This component, when rendered, is solely responsible for triggering side effects
 * that write cookies, both on the server and on the client.
 *
 * See https://github.com/gaearon/react-side-effect for details about how
 * `reducePropsToState` and `handleStateChangeOnClient` are used by the `withSideEffect`
 * HOC
 */
const Cookie = (props: CookieProps) => null;

const reducePropsToState = (propsList: Array<CookieProps>): CookieMap =>
	// consolidate cookie defs with the same name - innermost <Cookie> has precedent
	propsList.reduce((acc: CookieMap, props: CookieProps) => {
		const { name, children, ...options } = props;
		const baseOptions: {
			...HapiServerStateCookieOptions,
			value: string,
		} = {
			value: children || '',
		};
		acc[name] = Object.assign(baseOptions, options, defaults);
		return acc;
	}, {});

// The client-side side effect handler
// This will be called on initial render, so any server-supplied cookies will
// effectively be overwritten on the client with approximately the same information
// (server may supply 'max-age' while client provides 'expires' value)
export const handleStateChangeOnClient = (state: CookieMap) => {
	// loop through cookie key-values and set a cookie for each
	Object.keys(state).forEach(name => {
		const { value, path, domain, isSecure, ttl, isHttpOnly } = state[name];
		if (isHttpOnly) {
			// httpOnly cookies are only for server - cannot be handled on client
			return;
		}

		// set up cookie attributes argument for js-cookie
		// https://github.com/js-cookie/js-cookie/blob/master/README.md#cookie-attributes
		const options: CookieOptions = {
			path,
			domain,
			secure: isSecure,
		};
		if (ttl) {
			// js-cookie treats integer `expires` as whole-day values, so we will
			// convert the millisecond `ttl` value to `Date`, which is supported
			// for arbitrary times.
			options.expires = new Date(new Date().getTime() + ttl);
		}

		jsCookie.set(name, value, options);
	});
};

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(Cookie);
