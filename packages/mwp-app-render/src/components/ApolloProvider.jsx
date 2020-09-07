import React from 'react';
import ApolloClient, { InMemoryCache } from 'apollo-boost';
import fetch from 'isomorphic-fetch';
import { ApolloProvider } from 'react-apollo';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://api.meetup.com/gql';

let cachedClient;

const getClient = isServer => {
	if (!cachedClient || isServer) {
		const options = {
			ssrMode: isServer,
			name: 'mup-web',
			cache: isServer
				? new InMemoryCache()
				: new InMemoryCache().restore(window.__APOLLO_STATE__),
			uri: GRAPHQL_ENDPOINT,
			credentials: 'include',
			fetch,
		};
		if (!isServer) {
			// @ts-ignore
			options.cache = new InMemoryCache().restore(window.__APOLLO_STATE__);
		}
		cachedClient = new ApolloClient(options);
	}

	return cachedClient;
};

const Provider = ({ children, isServer }) => (
	<ApolloProvider client={getClient(isServer)}>{children}</ApolloProvider>
);

export default Provider;
