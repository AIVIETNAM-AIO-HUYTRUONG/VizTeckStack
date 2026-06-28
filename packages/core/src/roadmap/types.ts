// ponytail: structural type avoids @apollo/client dual-instance collision across pnpm workspace
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApolloLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query<T>(options: { query: any; fetchPolicy?: string }): Promise<{ data: T }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate(options: { mutation: any; variables?: Record<string, any> }): Promise<{ data?: any }>;
}

export interface Roadmap {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status?: string;
}

export interface CreateRoadmapInput {
  title: string;
  slug: string;
  description: string;
}

export interface UpdateRoadmapInput {
  title?: string;
  description?: string;
  status?: string;
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; roadmap: Roadmap }
  | { type: 'delete'; roadmap: Roadmap };
