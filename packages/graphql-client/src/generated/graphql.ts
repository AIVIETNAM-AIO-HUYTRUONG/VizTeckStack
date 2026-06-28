import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type BreadcrumbItemDto = {
  __typename?: 'BreadcrumbItemDto';
  nodeId?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type CreateRoadmapInput = {
  coverImage?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type EdgeDto = {
  __typename?: 'EdgeDto';
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  sourceId: Scalars['String']['output'];
  targetId: Scalars['String']['output'];
};

export type EdgeInput = {
  label?: InputMaybe<Scalars['String']['input']>;
  sourceId: Scalars['String']['input'];
  targetId: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createRoadmap: RoadmapDto;
  deleteRoadmap: Scalars['Boolean']['output'];
  updateNodeContent: NodeDto;
  updateNodeCover: NodeDto;
  updateNodeIcon: NodeDto;
  updateNodeTitle: NodeDto;
  updateRoadmap: RoadmapDto;
  upsertGraph: RoadmapDetailDto;
};


export type MutationCreateRoadmapArgs = {
  input: CreateRoadmapInput;
};


export type MutationDeleteRoadmapArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateNodeContentArgs = {
  content: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateNodeCoverArgs = {
  coverImage?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateNodeIconArgs = {
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateNodeTitleArgs = {
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationUpdateRoadmapArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRoadmapInput;
};


export type MutationUpsertGraphArgs = {
  edges: Array<EdgeInput>;
  nodes: Array<NodeInput>;
  roadmapId: Scalars['ID']['input'];
};

export type NodeDto = {
  __typename?: 'NodeDto';
  content?: Maybe<Scalars['String']['output']>;
  coverImage?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  positionX?: Maybe<Scalars['Float']['output']>;
  positionY?: Maybe<Scalars['Float']['output']>;
  roadmapId: Scalars['String']['output'];
  targetRoadmapId?: Maybe<Scalars['String']['output']>;
  targetRoadmapSlug?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: NodeType;
};

export type NodeInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  positionX?: InputMaybe<Scalars['Float']['input']>;
  positionY?: InputMaybe<Scalars['Float']['input']>;
  targetRoadmapId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  type: NodeType;
};

export enum NodeType {
  Lesson = 'LESSON',
  Roadmap = 'ROADMAP'
}

export type Query = {
  __typename?: 'Query';
  node?: Maybe<NodeDto>;
  nodeBreadcrumb: Array<BreadcrumbItemDto>;
  roadmap?: Maybe<RoadmapDetailDto>;
  roadmapTree?: Maybe<RoadmapTreeDto>;
  roadmaps: Array<RoadmapDto>;
  search: Array<SearchResultDto>;
};


export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNodeBreadcrumbArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRoadmapArgs = {
  slug: Scalars['String']['input'];
};


export type QueryRoadmapTreeArgs = {
  slug: Scalars['String']['input'];
};


export type QuerySearchArgs = {
  q: Scalars['String']['input'];
  roadmapId?: InputMaybe<Scalars['ID']['input']>;
  titleOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RoadmapDetailDto = {
  __typename?: 'RoadmapDetailDto';
  edges: Array<EdgeDto>;
  nodes: Array<NodeDto>;
  roadmap?: Maybe<RoadmapDto>;
};

export type RoadmapDto = {
  __typename?: 'RoadmapDto';
  coverImage?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type RoadmapTreeDto = {
  __typename?: 'RoadmapTreeDto';
  nodes: Array<RoadmapTreeNodeDto>;
  rootSlug: Scalars['String']['output'];
  rootTitle: Scalars['String']['output'];
};

export type RoadmapTreeNodeDto = {
  __typename?: 'RoadmapTreeNodeDto';
  children?: Maybe<Array<RoadmapTreeNodeDto>>;
  id: Scalars['ID']['output'];
  roadmapId?: Maybe<Scalars['String']['output']>;
  roadmapSlug?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  targetRoadmapId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type SearchResultDto = {
  __typename?: 'SearchResultDto';
  breadcrumb: Array<Scalars['String']['output']>;
  coverImage?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  roadmapId: Scalars['ID']['output'];
  roadmapSlug: Scalars['String']['output'];
  roadmapTitle: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: NodeType;
  updatedAt: Scalars['String']['output'];
};

export type UpdateRoadmapInput = {
  coverImage?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type GetNodeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetNodeQuery = { __typename?: 'Query', node?: { __typename?: 'NodeDto', id: string, roadmapId: string, type: NodeType, title: string, positionX?: number | null, positionY?: number | null, targetRoadmapId?: string | null, targetRoadmapSlug?: string | null, content?: string | null, coverImage?: string | null, icon?: string | null } | null };

export type GetNodeBreadcrumbQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetNodeBreadcrumbQuery = { __typename?: 'Query', nodeBreadcrumb: Array<{ __typename?: 'BreadcrumbItemDto', title: string, slug?: string | null, nodeId?: string | null }> };

export type GetRoadmapTreeQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type GetRoadmapTreeQuery = { __typename?: 'Query', roadmapTree?: { __typename?: 'RoadmapTreeDto', rootSlug: string, rootTitle: string, nodes: Array<{ __typename?: 'RoadmapTreeNodeDto', id: string, title: string, type: string, slug?: string | null, targetRoadmapId?: string | null, roadmapSlug?: string | null, roadmapId?: string | null, children?: Array<{ __typename?: 'RoadmapTreeNodeDto', id: string, title: string, type: string, slug?: string | null, targetRoadmapId?: string | null, roadmapSlug?: string | null, roadmapId?: string | null }> | null }> } | null };

export type UpdateNodeContentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  content: Scalars['String']['input'];
}>;


export type UpdateNodeContentMutation = { __typename?: 'Mutation', updateNodeContent: { __typename?: 'NodeDto', id: string, content?: string | null } };

export type UpdateNodeTitleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
}>;


export type UpdateNodeTitleMutation = { __typename?: 'Mutation', updateNodeTitle: { __typename?: 'NodeDto', id: string, title: string } };

export type UpdateNodeCoverMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  coverImage?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateNodeCoverMutation = { __typename?: 'Mutation', updateNodeCover: { __typename?: 'NodeDto', id: string, coverImage?: string | null } };

export type UpdateNodeIconMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  icon?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateNodeIconMutation = { __typename?: 'Mutation', updateNodeIcon: { __typename?: 'NodeDto', id: string, icon?: string | null } };

export type ListRoadmapsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRoadmapsQuery = { __typename?: 'Query', roadmaps: Array<{ __typename?: 'RoadmapDto', id: string, slug: string, title: string, description?: string | null, coverImage?: string | null, status?: string | null }> };

export type GetRoadmapQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type GetRoadmapQuery = { __typename?: 'Query', roadmap?: { __typename?: 'RoadmapDetailDto', roadmap?: { __typename?: 'RoadmapDto', id: string, slug: string, title: string, description?: string | null, coverImage?: string | null, status?: string | null } | null, nodes: Array<{ __typename?: 'NodeDto', id: string, roadmapId: string, type: NodeType, title: string, positionX?: number | null, positionY?: number | null, targetRoadmapId?: string | null, targetRoadmapSlug?: string | null, content?: string | null, coverImage?: string | null, icon?: string | null }>, edges: Array<{ __typename?: 'EdgeDto', id: string, sourceId: string, targetId: string, label?: string | null }> } | null };

export type CreateRoadmapMutationVariables = Exact<{
  input: CreateRoadmapInput;
}>;


export type CreateRoadmapMutation = { __typename?: 'Mutation', createRoadmap: { __typename?: 'RoadmapDto', id: string, slug: string, title: string, description?: string | null, status?: string | null } };

export type UpdateRoadmapMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateRoadmapInput;
}>;


export type UpdateRoadmapMutation = { __typename?: 'Mutation', updateRoadmap: { __typename?: 'RoadmapDto', id: string, slug: string, title: string, description?: string | null, status?: string | null } };

export type DeleteRoadmapMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRoadmapMutation = { __typename?: 'Mutation', deleteRoadmap: boolean };

export type UpsertGraphMutationVariables = Exact<{
  roadmapId: Scalars['ID']['input'];
  nodes: Array<NodeInput> | NodeInput;
  edges: Array<EdgeInput> | EdgeInput;
}>;


export type UpsertGraphMutation = { __typename?: 'Mutation', upsertGraph: { __typename?: 'RoadmapDetailDto', roadmap?: { __typename?: 'RoadmapDto', id: string, slug: string, title: string, status?: string | null } | null, nodes: Array<{ __typename?: 'NodeDto', id: string, roadmapId: string, type: NodeType, title: string, positionX?: number | null, positionY?: number | null, targetRoadmapId?: string | null, targetRoadmapSlug?: string | null, content?: string | null, coverImage?: string | null, icon?: string | null }>, edges: Array<{ __typename?: 'EdgeDto', id: string, sourceId: string, targetId: string, label?: string | null }> } };

export type SearchQueryVariables = Exact<{
  q: Scalars['String']['input'];
  titleOnly?: InputMaybe<Scalars['Boolean']['input']>;
  roadmapId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SearchQuery = { __typename?: 'Query', search: Array<{ __typename?: 'SearchResultDto', id: string, type: NodeType, title: string, icon?: string | null, coverImage?: string | null, roadmapSlug: string, roadmapTitle: string, roadmapId: string, updatedAt: string, breadcrumb: Array<string> }> };


export const GetNodeDocument = gql`
    query GetNode($id: ID!) {
  node(id: $id) {
    id
    roadmapId
    type
    title
    positionX
    positionY
    targetRoadmapId
    targetRoadmapSlug
    content
    coverImage
    icon
  }
}
    `;

/**
 * __useGetNodeQuery__
 *
 * To run a query within a React component, call `useGetNodeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNodeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNodeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNodeQuery(baseOptions: Apollo.QueryHookOptions<GetNodeQuery, GetNodeQueryVariables> & ({ variables: GetNodeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetNodeQuery, GetNodeQueryVariables>(GetNodeDocument, options);
      }
export function useGetNodeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNodeQuery, GetNodeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetNodeQuery, GetNodeQueryVariables>(GetNodeDocument, options);
        }
// @ts-ignore
export function useGetNodeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetNodeQuery, GetNodeQueryVariables>): Apollo.UseSuspenseQueryResult<GetNodeQuery, GetNodeQueryVariables>;
export function useGetNodeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNodeQuery, GetNodeQueryVariables>): Apollo.UseSuspenseQueryResult<GetNodeQuery | undefined, GetNodeQueryVariables>;
export function useGetNodeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNodeQuery, GetNodeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetNodeQuery, GetNodeQueryVariables>(GetNodeDocument, options);
        }
export type GetNodeQueryHookResult = ReturnType<typeof useGetNodeQuery>;
export type GetNodeLazyQueryHookResult = ReturnType<typeof useGetNodeLazyQuery>;
export type GetNodeSuspenseQueryHookResult = ReturnType<typeof useGetNodeSuspenseQuery>;
export type GetNodeQueryResult = Apollo.QueryResult<GetNodeQuery, GetNodeQueryVariables>;
export const GetNodeBreadcrumbDocument = gql`
    query GetNodeBreadcrumb($id: ID!) {
  nodeBreadcrumb(id: $id) {
    title
    slug
    nodeId
  }
}
    `;

/**
 * __useGetNodeBreadcrumbQuery__
 *
 * To run a query within a React component, call `useGetNodeBreadcrumbQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNodeBreadcrumbQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNodeBreadcrumbQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNodeBreadcrumbQuery(baseOptions: Apollo.QueryHookOptions<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables> & ({ variables: GetNodeBreadcrumbQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>(GetNodeBreadcrumbDocument, options);
      }
export function useGetNodeBreadcrumbLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>(GetNodeBreadcrumbDocument, options);
        }
// @ts-ignore
export function useGetNodeBreadcrumbSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>): Apollo.UseSuspenseQueryResult<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>;
export function useGetNodeBreadcrumbSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>): Apollo.UseSuspenseQueryResult<GetNodeBreadcrumbQuery | undefined, GetNodeBreadcrumbQueryVariables>;
export function useGetNodeBreadcrumbSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>(GetNodeBreadcrumbDocument, options);
        }
export type GetNodeBreadcrumbQueryHookResult = ReturnType<typeof useGetNodeBreadcrumbQuery>;
export type GetNodeBreadcrumbLazyQueryHookResult = ReturnType<typeof useGetNodeBreadcrumbLazyQuery>;
export type GetNodeBreadcrumbSuspenseQueryHookResult = ReturnType<typeof useGetNodeBreadcrumbSuspenseQuery>;
export type GetNodeBreadcrumbQueryResult = Apollo.QueryResult<GetNodeBreadcrumbQuery, GetNodeBreadcrumbQueryVariables>;
export const GetRoadmapTreeDocument = gql`
    query GetRoadmapTree($slug: String!) {
  roadmapTree(slug: $slug) {
    rootSlug
    rootTitle
    nodes {
      id
      title
      type
      slug
      targetRoadmapId
      roadmapSlug
      roadmapId
      children {
        id
        title
        type
        slug
        targetRoadmapId
        roadmapSlug
        roadmapId
      }
    }
  }
}
    `;

/**
 * __useGetRoadmapTreeQuery__
 *
 * To run a query within a React component, call `useGetRoadmapTreeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRoadmapTreeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRoadmapTreeQuery({
 *   variables: {
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useGetRoadmapTreeQuery(baseOptions: Apollo.QueryHookOptions<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables> & ({ variables: GetRoadmapTreeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>(GetRoadmapTreeDocument, options);
      }
export function useGetRoadmapTreeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>(GetRoadmapTreeDocument, options);
        }
// @ts-ignore
export function useGetRoadmapTreeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>): Apollo.UseSuspenseQueryResult<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>;
export function useGetRoadmapTreeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>): Apollo.UseSuspenseQueryResult<GetRoadmapTreeQuery | undefined, GetRoadmapTreeQueryVariables>;
export function useGetRoadmapTreeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>(GetRoadmapTreeDocument, options);
        }
export type GetRoadmapTreeQueryHookResult = ReturnType<typeof useGetRoadmapTreeQuery>;
export type GetRoadmapTreeLazyQueryHookResult = ReturnType<typeof useGetRoadmapTreeLazyQuery>;
export type GetRoadmapTreeSuspenseQueryHookResult = ReturnType<typeof useGetRoadmapTreeSuspenseQuery>;
export type GetRoadmapTreeQueryResult = Apollo.QueryResult<GetRoadmapTreeQuery, GetRoadmapTreeQueryVariables>;
export const UpdateNodeContentDocument = gql`
    mutation UpdateNodeContent($id: ID!, $content: String!) {
  updateNodeContent(id: $id, content: $content) {
    id
    content
  }
}
    `;
export type UpdateNodeContentMutationFn = Apollo.MutationFunction<UpdateNodeContentMutation, UpdateNodeContentMutationVariables>;

/**
 * __useUpdateNodeContentMutation__
 *
 * To run a mutation, you first call `useUpdateNodeContentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNodeContentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNodeContentMutation, { data, loading, error }] = useUpdateNodeContentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useUpdateNodeContentMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNodeContentMutation, UpdateNodeContentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNodeContentMutation, UpdateNodeContentMutationVariables>(UpdateNodeContentDocument, options);
      }
export type UpdateNodeContentMutationHookResult = ReturnType<typeof useUpdateNodeContentMutation>;
export type UpdateNodeContentMutationResult = Apollo.MutationResult<UpdateNodeContentMutation>;
export type UpdateNodeContentMutationOptions = Apollo.BaseMutationOptions<UpdateNodeContentMutation, UpdateNodeContentMutationVariables>;
export const UpdateNodeTitleDocument = gql`
    mutation UpdateNodeTitle($id: ID!, $title: String!) {
  updateNodeTitle(id: $id, title: $title) {
    id
    title
  }
}
    `;
export type UpdateNodeTitleMutationFn = Apollo.MutationFunction<UpdateNodeTitleMutation, UpdateNodeTitleMutationVariables>;

/**
 * __useUpdateNodeTitleMutation__
 *
 * To run a mutation, you first call `useUpdateNodeTitleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNodeTitleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNodeTitleMutation, { data, loading, error }] = useUpdateNodeTitleMutation({
 *   variables: {
 *      id: // value for 'id'
 *      title: // value for 'title'
 *   },
 * });
 */
export function useUpdateNodeTitleMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNodeTitleMutation, UpdateNodeTitleMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNodeTitleMutation, UpdateNodeTitleMutationVariables>(UpdateNodeTitleDocument, options);
      }
export type UpdateNodeTitleMutationHookResult = ReturnType<typeof useUpdateNodeTitleMutation>;
export type UpdateNodeTitleMutationResult = Apollo.MutationResult<UpdateNodeTitleMutation>;
export type UpdateNodeTitleMutationOptions = Apollo.BaseMutationOptions<UpdateNodeTitleMutation, UpdateNodeTitleMutationVariables>;
export const UpdateNodeCoverDocument = gql`
    mutation UpdateNodeCover($id: ID!, $coverImage: String) {
  updateNodeCover(id: $id, coverImage: $coverImage) {
    id
    coverImage
  }
}
    `;
export type UpdateNodeCoverMutationFn = Apollo.MutationFunction<UpdateNodeCoverMutation, UpdateNodeCoverMutationVariables>;

/**
 * __useUpdateNodeCoverMutation__
 *
 * To run a mutation, you first call `useUpdateNodeCoverMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNodeCoverMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNodeCoverMutation, { data, loading, error }] = useUpdateNodeCoverMutation({
 *   variables: {
 *      id: // value for 'id'
 *      coverImage: // value for 'coverImage'
 *   },
 * });
 */
export function useUpdateNodeCoverMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNodeCoverMutation, UpdateNodeCoverMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNodeCoverMutation, UpdateNodeCoverMutationVariables>(UpdateNodeCoverDocument, options);
      }
export type UpdateNodeCoverMutationHookResult = ReturnType<typeof useUpdateNodeCoverMutation>;
export type UpdateNodeCoverMutationResult = Apollo.MutationResult<UpdateNodeCoverMutation>;
export type UpdateNodeCoverMutationOptions = Apollo.BaseMutationOptions<UpdateNodeCoverMutation, UpdateNodeCoverMutationVariables>;
export const UpdateNodeIconDocument = gql`
    mutation UpdateNodeIcon($id: ID!, $icon: String) {
  updateNodeIcon(id: $id, icon: $icon) {
    id
    icon
  }
}
    `;
export type UpdateNodeIconMutationFn = Apollo.MutationFunction<UpdateNodeIconMutation, UpdateNodeIconMutationVariables>;

/**
 * __useUpdateNodeIconMutation__
 *
 * To run a mutation, you first call `useUpdateNodeIconMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNodeIconMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNodeIconMutation, { data, loading, error }] = useUpdateNodeIconMutation({
 *   variables: {
 *      id: // value for 'id'
 *      icon: // value for 'icon'
 *   },
 * });
 */
export function useUpdateNodeIconMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNodeIconMutation, UpdateNodeIconMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNodeIconMutation, UpdateNodeIconMutationVariables>(UpdateNodeIconDocument, options);
      }
export type UpdateNodeIconMutationHookResult = ReturnType<typeof useUpdateNodeIconMutation>;
export type UpdateNodeIconMutationResult = Apollo.MutationResult<UpdateNodeIconMutation>;
export type UpdateNodeIconMutationOptions = Apollo.BaseMutationOptions<UpdateNodeIconMutation, UpdateNodeIconMutationVariables>;
export const ListRoadmapsDocument = gql`
    query ListRoadmaps {
  roadmaps {
    id
    slug
    title
    description
    coverImage
    status
  }
}
    `;

/**
 * __useListRoadmapsQuery__
 *
 * To run a query within a React component, call `useListRoadmapsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListRoadmapsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListRoadmapsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListRoadmapsQuery(baseOptions?: Apollo.QueryHookOptions<ListRoadmapsQuery, ListRoadmapsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListRoadmapsQuery, ListRoadmapsQueryVariables>(ListRoadmapsDocument, options);
      }
export function useListRoadmapsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListRoadmapsQuery, ListRoadmapsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListRoadmapsQuery, ListRoadmapsQueryVariables>(ListRoadmapsDocument, options);
        }
// @ts-ignore
export function useListRoadmapsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListRoadmapsQuery, ListRoadmapsQueryVariables>): Apollo.UseSuspenseQueryResult<ListRoadmapsQuery, ListRoadmapsQueryVariables>;
export function useListRoadmapsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListRoadmapsQuery, ListRoadmapsQueryVariables>): Apollo.UseSuspenseQueryResult<ListRoadmapsQuery | undefined, ListRoadmapsQueryVariables>;
export function useListRoadmapsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListRoadmapsQuery, ListRoadmapsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListRoadmapsQuery, ListRoadmapsQueryVariables>(ListRoadmapsDocument, options);
        }
export type ListRoadmapsQueryHookResult = ReturnType<typeof useListRoadmapsQuery>;
export type ListRoadmapsLazyQueryHookResult = ReturnType<typeof useListRoadmapsLazyQuery>;
export type ListRoadmapsSuspenseQueryHookResult = ReturnType<typeof useListRoadmapsSuspenseQuery>;
export type ListRoadmapsQueryResult = Apollo.QueryResult<ListRoadmapsQuery, ListRoadmapsQueryVariables>;
export const GetRoadmapDocument = gql`
    query GetRoadmap($slug: String!) {
  roadmap(slug: $slug) {
    roadmap {
      id
      slug
      title
      description
      coverImage
      status
    }
    nodes {
      id
      roadmapId
      type
      title
      positionX
      positionY
      targetRoadmapId
      targetRoadmapSlug
      content
      coverImage
      icon
    }
    edges {
      id
      sourceId
      targetId
      label
    }
  }
}
    `;

/**
 * __useGetRoadmapQuery__
 *
 * To run a query within a React component, call `useGetRoadmapQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRoadmapQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRoadmapQuery({
 *   variables: {
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useGetRoadmapQuery(baseOptions: Apollo.QueryHookOptions<GetRoadmapQuery, GetRoadmapQueryVariables> & ({ variables: GetRoadmapQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetRoadmapQuery, GetRoadmapQueryVariables>(GetRoadmapDocument, options);
      }
export function useGetRoadmapLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetRoadmapQuery, GetRoadmapQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetRoadmapQuery, GetRoadmapQueryVariables>(GetRoadmapDocument, options);
        }
// @ts-ignore
export function useGetRoadmapSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetRoadmapQuery, GetRoadmapQueryVariables>): Apollo.UseSuspenseQueryResult<GetRoadmapQuery, GetRoadmapQueryVariables>;
export function useGetRoadmapSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRoadmapQuery, GetRoadmapQueryVariables>): Apollo.UseSuspenseQueryResult<GetRoadmapQuery | undefined, GetRoadmapQueryVariables>;
export function useGetRoadmapSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRoadmapQuery, GetRoadmapQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetRoadmapQuery, GetRoadmapQueryVariables>(GetRoadmapDocument, options);
        }
export type GetRoadmapQueryHookResult = ReturnType<typeof useGetRoadmapQuery>;
export type GetRoadmapLazyQueryHookResult = ReturnType<typeof useGetRoadmapLazyQuery>;
export type GetRoadmapSuspenseQueryHookResult = ReturnType<typeof useGetRoadmapSuspenseQuery>;
export type GetRoadmapQueryResult = Apollo.QueryResult<GetRoadmapQuery, GetRoadmapQueryVariables>;
export const CreateRoadmapDocument = gql`
    mutation CreateRoadmap($input: CreateRoadmapInput!) {
  createRoadmap(input: $input) {
    id
    slug
    title
    description
    status
  }
}
    `;
export type CreateRoadmapMutationFn = Apollo.MutationFunction<CreateRoadmapMutation, CreateRoadmapMutationVariables>;

/**
 * __useCreateRoadmapMutation__
 *
 * To run a mutation, you first call `useCreateRoadmapMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateRoadmapMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createRoadmapMutation, { data, loading, error }] = useCreateRoadmapMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateRoadmapMutation(baseOptions?: Apollo.MutationHookOptions<CreateRoadmapMutation, CreateRoadmapMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateRoadmapMutation, CreateRoadmapMutationVariables>(CreateRoadmapDocument, options);
      }
export type CreateRoadmapMutationHookResult = ReturnType<typeof useCreateRoadmapMutation>;
export type CreateRoadmapMutationResult = Apollo.MutationResult<CreateRoadmapMutation>;
export type CreateRoadmapMutationOptions = Apollo.BaseMutationOptions<CreateRoadmapMutation, CreateRoadmapMutationVariables>;
export const UpdateRoadmapDocument = gql`
    mutation UpdateRoadmap($id: ID!, $input: UpdateRoadmapInput!) {
  updateRoadmap(id: $id, input: $input) {
    id
    slug
    title
    description
    status
  }
}
    `;
export type UpdateRoadmapMutationFn = Apollo.MutationFunction<UpdateRoadmapMutation, UpdateRoadmapMutationVariables>;

/**
 * __useUpdateRoadmapMutation__
 *
 * To run a mutation, you first call `useUpdateRoadmapMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateRoadmapMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateRoadmapMutation, { data, loading, error }] = useUpdateRoadmapMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateRoadmapMutation(baseOptions?: Apollo.MutationHookOptions<UpdateRoadmapMutation, UpdateRoadmapMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateRoadmapMutation, UpdateRoadmapMutationVariables>(UpdateRoadmapDocument, options);
      }
export type UpdateRoadmapMutationHookResult = ReturnType<typeof useUpdateRoadmapMutation>;
export type UpdateRoadmapMutationResult = Apollo.MutationResult<UpdateRoadmapMutation>;
export type UpdateRoadmapMutationOptions = Apollo.BaseMutationOptions<UpdateRoadmapMutation, UpdateRoadmapMutationVariables>;
export const DeleteRoadmapDocument = gql`
    mutation DeleteRoadmap($id: ID!) {
  deleteRoadmap(id: $id)
}
    `;
export type DeleteRoadmapMutationFn = Apollo.MutationFunction<DeleteRoadmapMutation, DeleteRoadmapMutationVariables>;

/**
 * __useDeleteRoadmapMutation__
 *
 * To run a mutation, you first call `useDeleteRoadmapMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteRoadmapMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteRoadmapMutation, { data, loading, error }] = useDeleteRoadmapMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteRoadmapMutation(baseOptions?: Apollo.MutationHookOptions<DeleteRoadmapMutation, DeleteRoadmapMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteRoadmapMutation, DeleteRoadmapMutationVariables>(DeleteRoadmapDocument, options);
      }
export type DeleteRoadmapMutationHookResult = ReturnType<typeof useDeleteRoadmapMutation>;
export type DeleteRoadmapMutationResult = Apollo.MutationResult<DeleteRoadmapMutation>;
export type DeleteRoadmapMutationOptions = Apollo.BaseMutationOptions<DeleteRoadmapMutation, DeleteRoadmapMutationVariables>;
export const UpsertGraphDocument = gql`
    mutation UpsertGraph($roadmapId: ID!, $nodes: [NodeInput!]!, $edges: [EdgeInput!]!) {
  upsertGraph(roadmapId: $roadmapId, nodes: $nodes, edges: $edges) {
    roadmap {
      id
      slug
      title
      status
    }
    nodes {
      id
      roadmapId
      type
      title
      positionX
      positionY
      targetRoadmapId
      targetRoadmapSlug
      content
      coverImage
      icon
    }
    edges {
      id
      sourceId
      targetId
      label
    }
  }
}
    `;
export type UpsertGraphMutationFn = Apollo.MutationFunction<UpsertGraphMutation, UpsertGraphMutationVariables>;

/**
 * __useUpsertGraphMutation__
 *
 * To run a mutation, you first call `useUpsertGraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertGraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertGraphMutation, { data, loading, error }] = useUpsertGraphMutation({
 *   variables: {
 *      roadmapId: // value for 'roadmapId'
 *      nodes: // value for 'nodes'
 *      edges: // value for 'edges'
 *   },
 * });
 */
export function useUpsertGraphMutation(baseOptions?: Apollo.MutationHookOptions<UpsertGraphMutation, UpsertGraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertGraphMutation, UpsertGraphMutationVariables>(UpsertGraphDocument, options);
      }
export type UpsertGraphMutationHookResult = ReturnType<typeof useUpsertGraphMutation>;
export type UpsertGraphMutationResult = Apollo.MutationResult<UpsertGraphMutation>;
export type UpsertGraphMutationOptions = Apollo.BaseMutationOptions<UpsertGraphMutation, UpsertGraphMutationVariables>;
export const SearchDocument = gql`
    query Search($q: String!, $titleOnly: Boolean, $roadmapId: ID) {
  search(q: $q, titleOnly: $titleOnly, roadmapId: $roadmapId) {
    id
    type
    title
    icon
    coverImage
    roadmapSlug
    roadmapTitle
    roadmapId
    updatedAt
    breadcrumb
  }
}
    `;

/**
 * __useSearchQuery__
 *
 * To run a query within a React component, call `useSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchQuery({
 *   variables: {
 *      q: // value for 'q'
 *      titleOnly: // value for 'titleOnly'
 *      roadmapId: // value for 'roadmapId'
 *   },
 * });
 */
export function useSearchQuery(baseOptions: Apollo.QueryHookOptions<SearchQuery, SearchQueryVariables> & ({ variables: SearchQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
      }
export function useSearchLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchQuery, SearchQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
        }
// @ts-ignore
export function useSearchSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchQuery, SearchQueryVariables>): Apollo.UseSuspenseQueryResult<SearchQuery, SearchQueryVariables>;
export function useSearchSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchQuery, SearchQueryVariables>): Apollo.UseSuspenseQueryResult<SearchQuery | undefined, SearchQueryVariables>;
export function useSearchSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchQuery, SearchQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
        }
export type SearchQueryHookResult = ReturnType<typeof useSearchQuery>;
export type SearchLazyQueryHookResult = ReturnType<typeof useSearchLazyQuery>;
export type SearchSuspenseQueryHookResult = ReturnType<typeof useSearchSuspenseQuery>;
export type SearchQueryResult = Apollo.QueryResult<SearchQuery, SearchQueryVariables>;