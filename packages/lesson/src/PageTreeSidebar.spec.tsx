/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { PageTreeSidebar } from '@vizteck/core';
import type { PageTree } from '@vizteck/core';

const tree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    {
      id: 'n1', title: 'HTML & CSS', type: 'ROADMAP',
      slug: 'html-css', targetRoadmapId: 'r2',
      children: [
        { id: 'n3', title: 'Box Model', type: 'LESSON', roadmapSlug: 'html-css', roadmapId: 'r2' },
        { id: 'n4', title: 'Flexbox', type: 'LESSON', roadmapSlug: 'html-css', roadmapId: 'r2' },
      ],
    },
    {
      id: 'n2', title: 'JavaScript', type: 'ROADMAP',
      slug: 'javascript', targetRoadmapId: 'r3',
      children: [
        { id: 'n5', title: 'Variables', type: 'LESSON', roadmapSlug: 'javascript', roadmapId: 'r3' },
      ],
    },
  ],
};

const getLessonHref = (n: { id: string; roadmapSlug?: string }) =>
  `/roadmap/${n.roadmapSlug}/node/${n.id}`;

it('renders root title as header', () => {
  render(<PageTreeSidebar tree={tree} getLessonHref={getLessonHref as any} />);
  expect(screen.getByText('Frontend')).toBeInTheDocument();
});

it('auto-expands path to currentNodeId on mount', () => {
  render(
    <PageTreeSidebar tree={tree} currentNodeId="n3" getLessonHref={getLessonHref as any} />
  );
  // 'HTML & CSS' is the parent of n3, should be expanded → child 'Box Model' visible
  expect(screen.getByText('Box Model')).toBeInTheDocument();
  // 'JavaScript' is not in path → collapsed → 'Variables' not visible
  expect(screen.queryByText('Variables')).not.toBeInTheDocument();
});

it('clicking a ROADMAP node toggles its children', () => {
  render(<PageTreeSidebar tree={tree} getLessonHref={getLessonHref as any} />);
  // Initially collapsed — Box Model not visible
  expect(screen.queryByText('Box Model')).not.toBeInTheDocument();
  // Click 'HTML & CSS' button to expand
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('HTML & CSS'))!;
  fireEvent.click(btn);
  expect(screen.getByText('Box Model')).toBeInTheDocument();
  // Click again to collapse
  fireEvent.click(btn);
  expect(screen.queryByText('Box Model')).not.toBeInTheDocument();
});
