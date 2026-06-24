'use client';

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useMemo } from 'react';
import { getToken } from '@/lib/api';

export function AdminApolloProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    const httpLink = createHttpLink({
      uri: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/graphql`,
    });

    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${getToken()}`,
      },
    }));

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
