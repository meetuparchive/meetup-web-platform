// @flow
import React from 'react';

type CookieMap = { [string]: string };
export type CookieOpts = {
	ttl?: number | null,
	isSecure?: boolean,
	isHttpOnly?: boolean,
	isSameSite?: false | 'Strict' | 'Lax', // https://www.owasp.org/index.php/SameSite - server side only
	path?: string | null,
	domain?: string | null,
};
type ContextProps = {
	get: (name?: string) => string | CookieMap,
	set: (name: string, value: string, opts: CookieOpts) => void,
};
const CookieContext = React.createContext<ContextProps>({
	set: () => undefined,
	get: (name?: string) => '',
});
export const CookieProvider = (props: ContextProps & { children: React$Node }) => (
	<CookieContext.Provider value={{ get: props.get, set: props.set }}>
		{props.children}
	</CookieContext.Provider>
);

// subset of HapiServerStateCookieOptions (see flow-typed libdef) that can be
// used to supply cookie config opts to Hapi `h.state()` and js-cookie `Cookie.set()`
type SetCookieProps = CookieOpts & {
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
 */
const _SetCookie = (props: SetCookieProps) => {
	const { name, children, ...options } = props;
	Object.assign(options, defaults);
	return (
		<CookieContext.Consumer>
			{Cookie => {
				Cookie.set(name, children || '', options);
				return null; // no render
			}}
		</CookieContext.Consumer>
	);
};
export const SetCookie = React.memo<typeof _SetCookie>(_SetCookie);

// Simpler consumer that calls children function with the value of
// the cookie named by props.name
export const CookieConsumer = (props: {
	name: string,
	children: (string | CookieMap) => React$Node,
}) => (
	<CookieContext.Consumer>
		{Cookie => props.children(Cookie.get(props.name))}
	</CookieContext.Consumer>
);
