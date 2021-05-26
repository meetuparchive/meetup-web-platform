import ApolloClient, { InMemoryCache } from 'apollo-boost';
import fetch from 'isomorphic-fetch';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://www.meetup.com/gql';

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
		cachedClient = new ApolloClient(options);
	}

	return cachedClient;
};

export default getClient;
