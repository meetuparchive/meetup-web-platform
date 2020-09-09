import React from 'react';
import { ApolloProvider } from 'react-apollo';

const Provider = ({ children, client }) => (
	<ApolloProvider client={client}>{children}</ApolloProvider>
);

export default Provider;
