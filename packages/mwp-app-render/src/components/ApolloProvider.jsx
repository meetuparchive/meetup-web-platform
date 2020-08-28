import React from 'react';
import ApolloClient, { InMemoryCache } from 'apollo-boost';
import fetch from 'isomorphic-fetch';
import { ApolloProvider } from 'react-apollo';
import { isServer } from '../util/isServer';

let cachedClient;

const getClient = () => {
	if (!cachedClient || isServer()) {
		const options = {
			ssrMode: isServer(),
			name: 'mup-web',
			cache: isServer()
				? new InMemoryCache()
				: new InMemoryCache().restore(window.__APOLLO_STATE__),
			uri: 'https://api.meetup.com/gql',
			credentials: 'include',
			fetch,
		};
		if (!isServer()) {
			// @ts-ignore
			options.cache = new InMemoryCache().restore(window.__APOLLO_STATE__);
		}
		cachedClient = new ApolloClient(options);
	}

	return cachedClient;
};

const Provider = ({ children }) => (
	<ApolloProvider client={getClient()}>{children}</ApolloProvider>
);

export default Provider;
