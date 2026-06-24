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
  updateNodeCover: NodeDto;
  updateNodeIcon: NodeDto;
  updateRoadmap: RoadmapDto;
  upsertGraph: RoadmapDetailDto;
};


export type MutationCreateRoadmapArgs = {
  input: CreateRoadmapInput;
};


export type MutationDeleteRoadmapArgs = {
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

export type SearchQueryVariables = Exact<{
  q: Scalars['String']['input'];
  titleOnly?: InputMaybe<Scalars['Boolean']['input']>;
  roadmapId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SearchQuery = { __typename?: 'Query', search: Array<{ __typename?: 'SearchResultDto', id: string, type: NodeType, title: string, icon?: string | null, coverImage?: string | null, roadmapSlug: string, roadmapTitle: string, roadmapId: string, updatedAt: string, breadcrumb: Array<string> }> };


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