# Notion Search (Cmd+K) — Design Spec

**Goal:** Add a Notion-style Cmd+K search modal to both `apps/web` and `apps/admin`, supporting full-text search across roadmap and lesson titles and content, with filters, time grouping, and a preview panel.

**Architecture:** New `searchNodes` gRPC method in svc-roadmap using Prisma ILIKE; exposed as GraphQL Query in api-gateway; consumed via Apollo Client with auto-generated typed hooks from a new `packages/graphql-client` codegen package.

**Tech Stack:** Apollo Client, `@graphql-codegen/cli`, NestJS GraphQL (TypeGraphQL / code-first), Prisma ILIKE, PostgreSQL.

---

## Global Constraints

- All new packages follow the existing monorepo structure: `packages/<name>` with `@vizteck/<name>` package name.
- `packages/*` must not import from `apps/*`.
- `apps/web` shows only `PUBLIC` roadmaps; `apps/admin` sees all statuses.
- Admin requests include `Authorization: Bearer <token>` — Apollo Link handles this automatically.
- Tailwind semantic tokens only (`bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo`, etc.) — no hardcoded hex colors.
- Dark mode via `darkMode: 'class'` — all components must respect `.dark` class on `<html>`.
- Conventional Commits format for all commits.
- Search results capped at 20 items per query.
- Minimum query length: 2 characters before triggering API call.
- Debounce: 300ms after last keystroke.
- **Out of scope:** "Created by" filter — VizTeckStack has no user/auth system yet (planned Phase G). Filter slot shown in UI but disabled/hidden.
- **Out of scope:** Ctrl+. "Open in new tab" shortcut — deferred to future iteration.
- `packages/lesson` gains `@apollo/client` and `@vizteck/graphql-client` as new dependencies (acceptable: package already has heavy BlockNote deps).

---

## 1. Package: `packages/graphql-client`

New shared package `@vizteck/graphql-client`. Single source of truth for all GraphQL query definitions and generated types.

**Files:**

```
packages/graphql-client/
  package.json             (@vizteck/graphql-client)
  codegen.ts               graphql-codegen config
  src/
    queries/
      search.graphql       SEARCH_QUERY definition
    generated/
      graphql.ts           AUTO-GENERATED — types + hooks (never edit manually)
  tsconfig.json
```

**`codegen.ts` config:**

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:3000/graphql",
  documents: "src/queries/**/*.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: { withHooks: true },
    },
  },
};
export default config;
```

**`search.graphql`:**

```graphql
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
```

Generates `useSearchLazyQuery` with full TypeScript types. Run `pnpm codegen` from repo root (added to Turborepo pipeline) after any schema change.

---

## 2. Backend: Proto

**Add to `packages/proto/roadmap.proto`:**

```proto
message SearchRequest {
  string q = 1;
  bool title_only = 2;
  string roadmap_id = 3;  // empty string = search all roadmaps
}

message SearchResultItem {
  string id = 1;
  int32 type = 2;           // 0 = ROADMAP, 1 = LESSON
  string title = 3;
  string icon = 4;
  string cover_image = 5;
  string roadmap_slug = 6;
  string roadmap_title = 7;
  string roadmap_id = 8;
  string updated_at = 9;    // ISO 8601 string
  repeated string breadcrumb = 10;
}

message SearchResponse {
  repeated SearchResultItem results = 1;
}
```

**Add to `RoadmapService` RPC block:**

```proto
rpc SearchNodes(SearchRequest) returns (SearchResponse);
```

Regenerate with `cd packages/proto && node generate.js`.

---

## 3. Backend: svc-roadmap

**New method `searchNodes` in `apps/svc-roadmap/src/roadmap/roadmap.service.ts`:**

```ts
async searchNodes({ q, title_only, roadmap_id }: SearchRequest): Promise<SearchResponse> {
  if (!q || q.length < 2) return { results: [] };

  const nodes = await db.node.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        ...(!title_only ? [{ content: { path: [], string_contains: q } }] : []),
      ],
      ...(roadmap_id ? { roadmapId: roadmap_id } : {}),
    },
    include: { roadmap: true },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  return {
    results: nodes.map((n) => ({
      id: n.id,
      type: n.type === 'ROADMAP' ? 0 : 1,
      title: n.title,
      icon: n.icon ?? '',
      cover_image: n.coverImage ?? '',
      roadmap_slug: n.roadmap.slug,
      roadmap_title: n.roadmap.title,
      roadmap_id: n.roadmapId,
      updated_at: n.updatedAt.toISOString(),
      breadcrumb: [n.roadmap.title, n.title],
    })),
  };
}
```

**Note:** `apps/web` passes only PUBLIC scope — the GraphQL resolver filters by roadmap status before calling gRPC (see Section 4). svc-roadmap itself is not status-aware.

---

## 4. Backend: api-gateway

### GraphQL DTO (`roadmap.dto.ts`)

```ts
@ObjectType()
export class SearchResultDto {
  @Field(() => ID) id: string;
  @Field(() => NodeTypeEnum) type: NodeTypeEnum;
  @Field() title: string;
  @Field({ nullable: true }) icon?: string;
  @Field({ nullable: true }) coverImage?: string;
  @Field() roadmapSlug: string;
  @Field() roadmapTitle: string;
  @Field(() => ID) roadmapId: string;
  @Field() updatedAt: string;
  @Field(() => [String]) breadcrumb: string[];
}
```

### GraphQL Resolver (`roadmap.resolver.ts`)

```ts
@Query(() => [SearchResultDto])
async search(
  @Args('q') q: string,
  @Args('titleOnly', { nullable: true, defaultValue: false }) titleOnly: boolean,
  @Args('roadmapId', { type: () => ID, nullable: true }) roadmapId?: string,
  @Context() ctx?: { req: { headers: { authorization?: string } } },
): Promise<SearchResultDto[]> {
  const isAdmin = ctx?.req?.headers?.authorization?.startsWith('Bearer ');
  const result = await this.grpc.searchNodes({ q, title_only: titleOnly, roadmap_id: roadmapId ?? '' });
  const items = result.results ?? [];
  // Web scope: only PUBLIC roadmaps. Admin sees all.
  if (!isAdmin) {
    const publicRoadmaps = await this.grpc.getRoadmaps();
    const publicIds = new Set((publicRoadmaps.roadmaps ?? [])
      .filter((r) => r.status === 'PUBLIC')
      .map((r) => r.id));
    return items.filter((r) => publicIds.has(r.roadmap_id)).map(toSearchResultDto);
  }
  return items.map(toSearchResultDto);
}
```

### REST Controller (`roadmap.rest.controller.ts`) — Swagger only

```ts
@Get('search')
@ApiOperation({ summary: 'Search nodes and roadmaps (full-text)' })
search(
  @Query('q') q: string,
  @Query('titleOnly') titleOnly?: string,
  @Query('roadmapId') roadmapId?: string,
) {
  return this.grpc.searchNodes({ q, title_only: titleOnly === 'true', roadmap_id: roadmapId ?? '' });
}
```

---

## 5. Apollo Client Setup

### `packages/graphql-client` exports

```ts
export { useSearchLazyQuery } from "./src/generated/graphql";
export type {
  SearchQuery,
  SearchQueryVariables,
  SearchResultDtoFragment,
} from "./src/generated/graphql";
```

### `apps/web` — `ApolloProvider.tsx`

```tsx
"use client";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/graphql`,
  cache: new InMemoryCache(),
});

export function WebApolloProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
```

Mount in `apps/web/src/app/layout.tsx` wrapping all children.

### `apps/admin` — `ApolloProvider.tsx`

```tsx
"use client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  ApolloLink,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getToken } from "@/lib/api";

const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/graphql`,
});

const authLink = setContext((_, { headers }) => ({
  headers: { ...headers, Authorization: `Bearer ${getToken()}` },
}));

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export function AdminApolloProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
```

Mount in `apps/admin/src/app/layout.tsx` wrapping all children.

---

## 6. Frontend: SearchModal (packages/lesson)

### New files in `packages/lesson/src/`

```
SearchModal.tsx          modal shell: backdrop, 2-column layout
SearchResultItem.tsx     single result row: icon + title + breadcrumb
SearchPreview.tsx        right panel: cover image + title + breadcrumb
useSearchModal.ts        Ctrl+K / Cmd+K listener, open/close state
useSearch.ts             useLazyQuery + debounce 300ms + time grouping
types.ts                 SearchResult type (re-exported from graphql-client)
```

### `useSearchModal.ts`

```ts
export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
```

### `useSearch.ts`

```ts
export function useSearch() {
  const [query, setQuery] = useState("");
  const [titleOnly, setTitleOnly] = useState(false);
  const [roadmapId, setRoadmapId] = useState<string | undefined>();
  const [search, { data, loading, error }] = useSearchLazyQuery();

  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(() => {
      search({ variables: { q: query, titleOnly, roadmapId } });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, titleOnly, roadmapId]);

  const grouped = groupByTime(data?.search ?? []);

  return {
    query,
    setQuery,
    titleOnly,
    setTitleOnly,
    roadmapId,
    setRoadmapId,
    grouped,
    loading,
    error,
  };
}
```

### Time grouping

```ts
function groupByTime(results: SearchResult[]) {
  const now = new Date();
  const groups: Record<string, SearchResult[]> = {
    Today: [],
    Yesterday: [],
    "Past week": [],
    Older: [],
  };
  for (const r of results) {
    const d = new Date(r.updatedAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) groups["Today"].push(r);
    else if (diffDays === 1) groups["Yesterday"].push(r);
    else if (diffDays <= 7) groups["Past week"].push(r);
    else groups["Older"].push(r);
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}
```

### `SearchModal.tsx` layout

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Search input                              ] [◫] [●] │
│ [Title only] [Created by ▾] [In ▾] [+ Filter]          │
├──────────────────────────┬──────────────────────────────┤
│ Yesterday                │                              │
│   Lesson Title — path  │   [cover image]              │
│  Lesson Title — path  │                              │
│ Past week                │   Hovered lesson title       │
│  Lesson Title — path  │   Roadmap › Lesson           │
│                          │                              │
└──────────────────────────┴──────────────────────────────┘
│ Ctrl+. Open in new tab                                  │
└─────────────────────────────────────────────────────────┘
```

### Props interface

```ts
export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  getLessonHref: (roadmapSlug: string, nodeId: string) => string;
  getRoadmapHref?: (roadmapSlug: string) => string;
}
```

Both apps pass their own href builders; modal has no routing dependency.

---

## 7. Integration in Apps

### `apps/web/src/app/layout.tsx`

```tsx
<WebApolloProvider>
  <SearchModalWrapper /> {/* 'use client' wrapper that calls useSearchModal */}
  {children}
</WebApolloProvider>
```

`getLessonHref`: `(roadmapSlug, nodeId) => /roadmap/${roadmapSlug}/node/${nodeId}`

### `apps/admin/src/app/layout.tsx`

```tsx
<AdminApolloProvider>
  <SearchModalWrapper />
  {children}
</AdminApolloProvider>
```

`getLessonHref`: `(roadmapSlug, nodeId) => /roadmaps/${roadmapId}/nodes/${nodeId}` (admin uses roadmap ID in URL, not slug — fetch from search result's `roadmapId` field)

---

## 8. Error Handling

| Scenario                | Behavior                                            |
| ----------------------- | --------------------------------------------------- |
| `q.length < 2`          | Show "Type at least 2 characters..." — no API call  |
| Network / GraphQL error | Show "Search unavailable" — do not crash modal      |
| Empty results           | Show "No results for '...'"                         |
| Loading                 | Skeleton list (3 rows, pulsing) — no flash of empty |
| Modal close             | Reset query + results state                         |

---

## 9. Testing

| Layer             | What                                                                                                        | Framework                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------- |
| `svc-roadmap`     | `searchNodes` with ILIKE — title match, content match, titleOnly flag, roadmapId filter, empty q returns [] | Jest                      |
| `api-gateway`     | GraphQL `search` query resolver — public filter, admin bypass                                               | Jest                      |
| `packages/lesson` | `useSearchModal` — Ctrl+K opens, Escape closes                                                              | Vitest                    |
| `packages/lesson` | `SearchModal` — renders results, Title only toggle, group headings                                          | Vitest + @testing-library |
| E2E               | Ctrl+K opens modal → type "lesson" → result appears → click → navigates                                     | Playwright                |

---

## 10. Codegen Workflow

```bash
# After any GraphQL schema change:
pnpm codegen                    # runs graphql-codegen in packages/graphql-client
pnpm --filter @vizteck/lesson build  # rebuild to pick up new types
```

Add `codegen` to Turborepo `pipeline` in `turbo.json`, running after `api-gateway#build` so schema is always fresh before codegen runs.
