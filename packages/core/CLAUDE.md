@../../rules/frontend.md
@../../rules/packages.md
@../../rules/testing.md

# Core Package

- Single source of truth for all feature logic
- Accept `ApolloLike` (`{ query, mutate }`) as first param — never import `adminApolloClient` here
- Feature-first layout: `roadmap/graph/` and `lesson/content-editor|page-tree|search/`
- Exports consumed by `packages/graph` and `packages/lesson` shims — keep public API stable
