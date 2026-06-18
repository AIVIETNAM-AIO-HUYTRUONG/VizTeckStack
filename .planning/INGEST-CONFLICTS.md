# Conflict Detection Report

Ingest set: 2 documents (both SPEC, high confidence)
Mode: new
Precedence: ADR > SPEC > PRD > DOC (no ADR or PRD documents present)
Cycle detection: no cycles found (cross_refs form a DAG; implementation plan refs design-spec scope items, not vice-versa)

---

### BLOCKERS (0)

No blockers detected.

No LOCKED ADR conflicts. No UNKNOWN/low-confidence documents. No ref graph cycles.

---

### WARNINGS (0)

No competing variants detected.

Both documents are SPEC type covering the same project. Where they overlap, the implementation plan provides more detail that is consistent with (not contradictory to) the design spec. No case was found where two SPECs defined the same requirement with divergent acceptance criteria.

---

### INFO (2)

[INFO] Auto-resolved: proto return type informal shorthand vs. committed contract
  Found: docs/superpowers/specs/2026-06-18-vizteckstack-design.md lists RoadmapService RPCs informally as returning type "Roadmap" for CreateRoadmap and UpdateRoadmap
  Found: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md defines the same RPCs returning "RoadmapItem"; committed packages/proto/roadmap.proto confirms RoadmapItem
  Scope: packages/proto — RoadmapService contract
  Ruling: Implementation plan + committed on-disk file win. Design spec used "Roadmap" as an informal shorthand in the overview table; the detailed proto definition in both the plan and the committed file uses "RoadmapItem". No intent conflict — just specification granularity difference.
  Action: synthesised intel uses RoadmapItem throughout.
  source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md (API Design section)
  source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md (Task 2, Step 2)
  source: packages/proto/roadmap.proto (committed artifact, lines 103-106)

[INFO] Auto-resolved: Prisma schema onDelete cascade — implementation adds constraint not in design spec
  Found: docs/superpowers/specs/2026-06-18-vizteckstack-design.md shows abstract Prisma schema without onDelete directives
  Found: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md adds onDelete: Cascade to Node.roadmap and both Edge relations; committed packages/db/prisma/schema.prisma confirms this
  Scope: packages/db — Prisma schema cascade behavior
  Ruling: Implementation plan + committed on-disk file win. The cascade rules are an additive safety constraint not contradicted by the design spec (which was silent on the topic). No conflict — the implementation plan makes the abstract spec more precise.
  Action: synthesised constraints.md uses the cascade-inclusive schema.
  source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md (Data Model section)
  source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md (Task 3, Step 2)
  source: packages/db/prisma/schema.prisma (committed artifact, lines 29, 46, 47)
