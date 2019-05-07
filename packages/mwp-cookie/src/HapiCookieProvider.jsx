// @flow
import React from 'react';
import { CookieProvider } from './Cookie';
import type { CookieOpts } from './Cookie';

type HapiCookieProviderProps = {
	request: HapiRequest,
	h: HapiResponseToolkit,
	children: React$Node,
};

const HapiCookieProvider = (props: HapiCookieProviderProps) => (
	<CookieProvider
		get={(name?: string) =>
			name ? props.request.state[name] : props.request.state
		}
		set={(name, value, opts: CookieOpts) => {
			const hapiStateOptions = { ...opts }; // make a copy here so that object can be used as HapiServerStateCookieOptions
			props.h.state(name, value, hapiStateOptions);
		}}
	>
		{props.children}
	</CookieProvider>
);

export default HapiCookieProvider;
