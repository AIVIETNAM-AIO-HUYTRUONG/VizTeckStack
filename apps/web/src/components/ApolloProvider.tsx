'use client';

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { useMemo } from 'react';

export function WebApolloProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/graphql`,
        cache: new InMemoryCache(),
      }),
    [],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
