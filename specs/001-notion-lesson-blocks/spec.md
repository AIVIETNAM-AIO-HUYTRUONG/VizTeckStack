# Feature Specification: Notion-Like Lesson Building Blocks

**Feature Branch**: `001-notion-lesson-blocks`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "thêm tính năng Core building blocks của notion vào lesson — Pages (sub-pages, templates, icon/cover/TOC, sharing), Blocks (toggle, callout, quote, divider, table, code, equation, embeds), Teamspaces & Navigation (sidebar, favorites, recent, search)"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rich Content Blocks in Lesson Editor (Priority: P1)

Content editors creating lessons can choose from a rich library of block types to structure learning material — toggles, callouts, code blocks, equations, embeds — beyond plain text and headings.

**Why this priority**: Core editing capability. Impacts every lesson created on the platform. All other features depend on a capable block layer.

**Independent Test**: A teacher opens a lesson in edit mode, inserts a toggle block, a callout, a code block with syntax highlighting, a LaTeX equation, and an image embed — all without any navigation or template features being present.

**Acceptance Scenarios**:

1. **Given** a lesson in edit mode, **When** the block picker is opened (e.g., via `/` slash command), **Then** available types include: paragraph, heading (H1/H2/H3), bullet list, numbered list, to-do checklist, toggle/accordion, callout, quote, divider, simple table, code block, equation (LaTeX), image, video, file, link preview/bookmark
2. **Given** a toggle block exists, **When** a learner clicks the toggle in view mode, **Then** nested content inside the toggle is revealed or hidden
3. **Given** a code block with content, **When** rendered in view mode, **Then** it displays with syntax highlighting and a copy-to-clipboard button
4. **Given** an equation block with LaTeX input (e.g., `E=mc^2`), **When** rendered, **Then** formatted mathematical notation is displayed
5. **Given** a callout block is created, **When** edited, **Then** the editor can set an icon (emoji) and a background color for the callout

---

### User Story 2 - Sub-Pages and Page Structure (Priority: P2)

Content editors can break a lesson into multiple nested pages, drag-drop to reorder them, and insert a live Table of Contents on any page.

**Why this priority**: Enables long-form courses to be split into logical units. Builds directly on the existing page-tree infrastructure already in the system.

**Independent Test**: A teacher creates a lesson with 3 sub-pages, drags the third page to the first position, inserts a Table of Contents block on the parent, and verifies the TOC lists all H1/H2/H3 headings in the page.

**Acceptance Scenarios**:

1. **Given** a lesson page open in the editor, **When** the editor clicks "Add sub-page", **Then** a new child page is created and appears in the page tree beneath the parent
2. **Given** multiple sub-pages in the tree, **When** one is dragged to a new position, **Then** the new order is reflected immediately and persists after page reload
3. **Given** a page with H1/H2/H3 headings, **When** a Table of Contents block is inserted, **Then** it auto-generates anchor links to each heading in document order
4. **Given** a heading is added or removed after a TOC block exists, **When** the page re-renders, **Then** the TOC updates to reflect the change
5. **Given** a sub-page is deleted, **When** it has its own sub-pages, **Then** the system prompts to confirm cascade deletion of all child pages

---

### User Story 3 - Page Templates (Priority: P2)

Content editors can create new lesson pages from predefined templates via a template picker on the "New" action.

**Why this priority**: Reduces repetitive setup. Encourages consistent lesson structure across courses without blocking any core functionality.

**Independent Test**: A teacher marks an existing page as a template, clicks "New" on another lesson, selects the template from the picker, and the new page is pre-filled with the template's block structure and headings.

**Acceptance Scenarios**:

1. **Given** the admin panel, **When** clicking the "New page" action, **Then** a picker appears showing available templates alongside a "Blank page" option
2. **Given** a template is selected, **When** the new page is created, **Then** it is pre-filled with the template's blocks (content is copied, not linked)
3. **Given** an existing page, **When** an admin marks it as a template, **Then** it appears in the template picker for future page creation
4. **Given** no templates have been created, **When** clicking "New", **Then** a blank page is created directly (no picker shown)

---

### User Story 4 - Sidebar Navigation, Favorites, Recent, and Search (Priority: P3)

Admin users can navigate the full lesson/page hierarchy through a persistent sidebar that surfaces favorites, recently visited pages, and a cross-lesson search.

**Why this priority**: Quality-of-life improvement for editors managing large numbers of lessons. Does not block learner access or core content creation.

**Independent Test**: An editor opens the admin panel, sees the sidebar with all lessons grouped by roadmap, stars a page as favorite, navigates away, returns and sees the favorited page in the Favorites section, then searches "introduction" and sees matching pages.

**Acceptance Scenarios**:

1. **Given** the admin panel is open, **When** the sidebar is visible, **Then** it shows all top-level lessons organized by roadmap
2. **Given** a page is open in the editor, **When** the star/favorite icon is clicked, **Then** the page appears in the Favorites section of the sidebar
3. **Given** navigation history exists, **When** the sidebar is open, **Then** a "Recent" section shows the last 10 visited pages in reverse-chronological order
4. **Given** a search query is entered in the sidebar search bar, **When** results appear, **Then** they show matching page titles with a content snippet and the page's location in the hierarchy

---

### User Story 5 - Teamspaces as Named Workspaces (Priority: P4)

Content editors can organize lessons into named workspaces (e.g., "Frontend Team", "Design Track") visible in the sidebar, without requiring user accounts or login changes.

**Why this priority**: Organizational convenience for large content libraries. Does not require any auth system changes.

**Independent Test**: An admin creates a teamspace named "Engineering Track", assigns 3 lessons to it, and the sidebar shows those lessons grouped under that label.

**Acceptance Scenarios**:

1. **Given** the admin panel, **When** an admin creates a teamspace with a name, **Then** it appears as a top-level section in the sidebar
2. **Given** a teamspace exists, **When** a lesson is assigned to it, **Then** the lesson appears nested under that teamspace in the sidebar
3. **Given** multiple teamspaces, **When** the sidebar is open, **Then** each teamspace is collapsible independently
4. **Given** a teamspace is deleted, **When** it had lessons assigned, **Then** those lessons move to an "Unassigned" section

---

### User Story 6 - Link-Based Page Sharing (Priority: P4)

Content editors can make any page publicly accessible via a unique shareable URL, without requiring viewers to log in.

**Why this priority**: Enables sharing specific lesson pages with external stakeholders without exposing the full admin panel or requiring new user accounts.

**Independent Test**: An admin toggles a page to "public", copies the shareable link, opens it in an incognito browser, and views the page content without logging in.

**Acceptance Scenarios**:

1. **Given** a lesson page in the editor, **When** the sharing toggle is set to "Public", **Then** a unique shareable URL is generated for that page
2. **Given** a public page URL, **When** opened by anyone without logging in, **Then** the page content is rendered in read-only view mode
3. **Given** a page is toggled back to "Private", **When** the shareable URL is accessed, **Then** the viewer receives an "access denied" or "page not found" response
4. **Given** a public page has sub-pages, **When** a viewer accesses the parent URL, **Then** only the parent page is public; sub-pages require their own individual public toggle

---

### Edge Cases

- What happens when a sub-page is deleted that has its own sub-pages? (cascade vs orphan)
- How does drag-drop behave at 5+ levels of nesting?
- What happens when a LaTeX equation has a syntax error?
- How does the TOC handle pages with no headings?
- What is the maximum file size for video/file embeds?
- How does search handle pages containing only embeds (no text)?
- What happens when a template page is deleted — do pages created from it remain intact?

---

## Requirements *(mandatory)*

### Functional Requirements

**Blocks (FR-001–FR-008)**

- **FR-001**: The lesson editor MUST support the following block types: paragraph, heading H1/H2/H3, bullet list, numbered list, to-do checklist, toggle/accordion, callout, quote, divider, simple table, code block, equation (LaTeX), image embed, video embed, file embed, link preview/bookmark
- **FR-002**: Toggle blocks MUST allow nesting other blocks inside them; the nested content MUST be collapsible in view mode
- **FR-003**: Code blocks MUST display with per-language syntax highlighting and a copy-to-clipboard action
- **FR-004**: Equation blocks MUST accept LaTeX syntax and render formatted mathematical notation in view mode
- **FR-005**: Callout blocks MUST allow setting an emoji icon and a background accent color
- **FR-006**: Image, video, and file embed blocks MUST accept both uploaded files and external URLs
- **FR-007**: Link preview/bookmark blocks MUST display a card with title, description, and favicon fetched from the target URL
- **FR-008**: To-do checklist blocks MUST persist checked/unchecked state per block (not per user session)

**Pages (FR-009–FR-014)**

- **FR-009**: Content editors MUST be able to create sub-pages within any lesson page from the page tree
- **FR-010**: The page tree MUST support drag-drop reordering of sub-pages within the same parent
- **FR-011**: A Table of Contents block MUST auto-generate anchor links from H1/H2/H3 headings on the current page
- **FR-012**: The TOC MUST update within 1 second when headings are added, removed, or renamed
- **FR-013**: Deleting a page with sub-pages MUST prompt for confirmation and cascade delete all descendants
- **FR-014**: Sub-pages MUST independently support icon (emoji) and cover image

**Templates (FR-015–FR-018)**

- **FR-015**: The "New page" action MUST present a template picker when at least one template exists
- **FR-016**: Selecting a template MUST create a new page pre-filled with the template's block content (deep copy)
- **FR-017**: Any existing page MUST be designatable as a template by an admin
- **FR-018**: Deleting a template page MUST NOT affect pages previously created from it

**Navigation (FR-019–FR-023)**

- **FR-019**: The admin panel MUST include a persistent sidebar displaying the full lesson/page hierarchy grouped by roadmap
- **FR-020**: Users MUST be able to mark/unmark any page as a favorite; favorites MUST persist across sessions
- **FR-021**: The sidebar MUST display the last 10 recently visited pages in a "Recent" section
- **FR-022**: A search input MUST return matching pages by title and content snippet in under 1 second across up to 1,000 pages
- **FR-023**: Search results MUST show the page's location in the hierarchy (breadcrumb path)

**Teamspaces (FR-024–FR-026)**

- **FR-024**: Admins MUST be able to create named teamspaces (workspaces) visible as top-level sections in the sidebar
- **FR-025**: Any lesson MUST be assignable to a teamspace; unassigned lessons appear under an "Unassigned" section
- **FR-026**: Deleting a teamspace MUST move its lessons to "Unassigned", not delete the lessons

**Per-Page Sharing (FR-027–FR-030)**

- **FR-027**: Each page MUST have a public/private sharing toggle accessible from the editor
- **FR-028**: Setting a page to "Public" MUST generate a unique, stable shareable URL for that page
- **FR-029**: A public page URL MUST render the page content in read-only view without requiring login
- **FR-030**: Setting a page back to "Private" MUST immediately revoke access to the shareable URL

### Key Entities

- **Page**: Lesson page with title, icon, cover, block content, parent page reference, order index, `isTemplate` flag, and optional `teamspace` label
- **Block**: Atomic content unit within a page — type, content payload, optional nested blocks (for toggle/sub-page), order index
- **Template**: A page with `isTemplate = true`; appears in the "New" picker; content is deep-copied on use
- **Favorite**: An association between an admin session/user and a page
- **RecentPage**: A record of the last-visited pages in chronological order, scoped to a session or user identity
- **Teamspace**: A named content workspace (label) for grouping top-level lessons in the sidebar — no user identity or membership required

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Content editors can insert any of the 16+ block types via the slash command picker in under 3 seconds
- **SC-002**: Toggle blocks open and close with no perceptible delay (under 100ms) in view mode
- **SC-003**: Sub-page drag-drop reordering reflects the new order within 500ms with no page reload required
- **SC-004**: The Table of Contents updates within 1 second of any heading change
- **SC-005**: Creating a page from a template takes no more than 2 additional interactions compared to creating a blank page
- **SC-006**: Sidebar search returns results within 1 second across a corpus of 1,000 pages
- **SC-007**: The page hierarchy renders correctly with at least 5 levels of sub-page nesting
- **SC-008**: 90% of content editors can create a lesson with sub-pages and a TOC on their first attempt without assistance
- **SC-009**: A shareable public page URL is generated within 1 second of toggling a page to "Public"
- **SC-010**: Teamspace sidebar sections load with no additional network requests beyond the initial sidebar render

---

## Assumptions

- The existing lesson editor (BlockNote) already handles paragraph, heading, bullet list, numbered list, basic table, and basic image — this feature extends it with the remaining block types
- Icon and cover image per page are partially implemented (existing `Node.icon` and `Node.coverImage` fields) — sub-pages will reuse the same mechanism
- File and video embeds leverage the existing uploadthing infrastructure for file storage
- The public viewer (`apps/web`) renders lesson content read-only; all editing features are admin-only
- LaTeX equations are rendered client-side (no server-side compilation required)
- Link preview cards (bookmark blocks) fetch metadata from target URLs at edit time and cache the result
- The sidebar Favorites and Recent features are scoped to a single admin session initially (no per-user persistence unless US5/US6 clarification adds user identity)
- Teamspaces are named content labels for organizing lessons in the sidebar — no user accounts or membership required (confirmed: Option A)
- Per-page sharing is link-based: public/private toggle + unique stable URL; no login required to view public pages (confirmed: Option A)
- Sharing is per-page and does not cascade to sub-pages automatically; each sub-page requires its own public toggle
- The page hierarchy drag-drop supports reordering within the same parent only (moving between parents is out of scope for v1)
