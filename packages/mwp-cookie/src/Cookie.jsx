// @flow
import withSideEffect from 'react-side-effect';
import jsCookie from 'js-cookie';

// subset of HapiServerStateCookieOptions that will work with Hapi `h.state()` and
// js-cookie `Cookie.set()`
type CookieOpts = {
	value?: string,
	ttl?: number, // milliseconds
	isHttpOnly?: boolean,
	isSecure?: boolean,
	path?: string,
	domain?: string,
};
type CookieProps = {
	children: string,
	name: string,
	...CookieOpts,
};
type CookieState = { [name: string]: CookieOpts };

const defaults = {
	path: '/',
	domain: '.meetup.com',
	isSecure: true,
};

/*
 * This component, when rendered, is solely responsible for triggering side effects
 * that write cookies, both on the server and on the client.
 */
const Cookie = (props: CookieProps) => null;

const reducePropsToState = (propsList: CookieState): CookieState =>
	// consolidate cookie defs with the same name - innermost <Cookie> has precedent
	propsList.reduce((acc: CookieState, props: CookieProps) => {
		const { name, children, ...options } = props;
		acc[name] = Object.assign({ value: children }, options, defaults);
		return acc;
	}, {});

// The client-side side effect handler
// This will be called on initial render, so any server-supplied cookies will
// effectively be overwritten on the client with approximately the same information
// (server may supply 'max-age' while client provides 'expires' value)
export const handleStateChangeOnClient = (state: CookieState) => {
	// loop through cookie key-values and set a cookie for each
	Object.keys(state).forEach(name => {
		const { value, path, domain, isSecure, ttl, isHttpOnly } = state[name];
		if (isHttpOnly) {
			// httpOnly cookies are only for server - cannot be handled on client
			return;
		}

		// set up cookie attributes argument for js-cookie
		// https://github.com/js-cookie/js-cookie/blob/master/README.md#cookie-attributes
		const options = {
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
