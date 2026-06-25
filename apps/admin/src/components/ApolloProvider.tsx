'use client';

import { ApolloProvider } from '@apollo/client';
import { adminApolloClient } from '@/lib/apolloClient';

export function AdminApolloProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={adminApolloClient}>{children}</ApolloProvider>;
}
