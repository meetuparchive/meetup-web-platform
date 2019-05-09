// @flow
import React from 'react';

/**
 * A React-Context-based universal cookie getter/setter.
 *
 * exported React components:
 * - CookieProvider
 * - SetCookie
 * - GetCookie
 */

type CookieMap = { [string]: string };

/**
 * These cookie configuration options are a subset of the option params
 * used by Hapi for
 * [the cookie-setting `server.state()` function](https://hapijs.com/api#-serverstatename-options).
 * They can be transformed into analogous params in 'js-cookie' for
 * [`Cookie.set()`](https://github.com/js-cookie/js-cookie/#cookie-attributes)
 */
export type CookieOpts = {
	ttl?: number | null,
	isSecure?: boolean,
	isHttpOnly?: boolean,
	isSameSite?: false | 'Strict' | 'Lax', // https://www.owasp.org/index.php/SameSite - server side only
	path?: string | null,
	domain?: string | null,
};
type ContextValue = {
	get: (name?: string) => string | CookieMap,
	set: (name: string, value: string, opts: CookieOpts) => void,
};
type ContextProps = ContextValue & {
	children: React$Node,
};
type SetCookieProps = CookieOpts & {
	children?: string,
	name: string,
};

export const OPT_DEFAULT = {
	path: '/',
	domain: '.meetup.com',
	isSecure: true,
	isSameSite: false,
};

/**
 * This context provides the link between the setter/getter routines
 * supplied by the rendering environment (server/browser) and the internals
 * of the application - it should not be used directly, but is used to compose
 * other exported components in this module.
 */
const CookieContext = React.createContext<ContextValue>({
	set: () => undefined,
	get: (name?: string) => '',
});

// The context provider - this should generally wrap the entire React application
export const CookieProvider = (props: ContextProps) => (
	<CookieContext.Provider value={{ get: props.get, set: props.set }}>
		{props.children}
	</CookieContext.Provider>
);

/**
 * This component is solely responsible for writing a cookie as
 * a side effect of rendering, using the `set` function from the CookieContext
 */
export const SetCookie = (props: SetCookieProps) => {
	const { name, children, ...options } = props;
	const optsWithDefaults = Object.assign({}, OPT_DEFAULT, options);
	return (
		<CookieContext.Consumer>
			{Cookie => {
				Cookie.set(name, children || '', optsWithDefaults);
				return null; // no render
			}}
		</CookieContext.Consumer>
	);
};

/**
 * Simple cookie context `get` consumer that calls children function with the
 * value of the cookie named by `props.name`
 */
export const GetCookie = (props: {
	name: string,
	children: (string | CookieMap) => React$Node,
}) => (
	<CookieContext.Consumer>
		{Cookie => props.children(Cookie.get(props.name))}
	</CookieContext.Consumer>
);
