// @flow
import React from 'react';
import { CookieProvider } from './Cookie';

type HapiCookieProviderProps = {
	request: HapiRequest,
	h: HapiResponseToolkit,
	children: React$Node,
};

const HapiCookieProvider = (props: HapiCookieProviderProps) => (
	<CookieProvider
		get={(name: ?string) =>
			name ? props.request.state[name] : props.request.state
		}
		set={props.h.state}
	>
		{props.children}
	</CookieProvider>
);

export default HapiCookieProvider;
