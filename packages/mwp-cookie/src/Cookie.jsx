// @flow
import withSideEffect from 'react-side-effect';
import jsCookie from 'js-cookie';

type CookieOpts = {
	value: ?string,
	ttl?: number,
	isHttpOnly?: boolean,
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

export const handleStateChangeOnClient = (state: CookieState) => {
	Object.keys(state).forEach(name => {
		const { value, ...options } = state[name];
		// determine 'expires' from 'ttl'?
		jsCookie.set(name, value, options);
	});
};

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(Cookie);
