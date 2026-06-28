/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonPageLayout } from '@vizteck/core';
import type { PageTree } from '@vizteck/core';

const tree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    { id: 'n1', title: 'Intro', type: 'LESSON', roadmapSlug: 'frontend', roadmapId: 'r1' },
  ],
};

const getLessonHref = (n: { id: string; roadmapSlug?: string }) =>
  `/roadmap/${n.roadmapSlug}/node/${n.id}`;

beforeEach(() => {
  localStorage.clear();
});

it('renders children', () => {
  render(
    <LessonPageLayout tree={tree} getLessonHref={getLessonHref as any}>
      <div data-testid="content">Content here</div>
    </LessonPageLayout>
  );
  expect(screen.getByTestId('content')).toBeInTheDocument();
});

it('reads initial collapsed state from localStorage', () => {
  localStorage.setItem('lesson-sidebar-collapsed', 'true');
  render(
    <LessonPageLayout tree={tree} getLessonHref={getLessonHref as any}>
      <div>Content</div>
    </LessonPageLayout>
  );
  // Sidebar should be collapsed — width 0
  const sidebar = document.querySelector('[data-testid="lesson-sidebar"]');
  expect(sidebar?.className).toContain('w-0');
});

it('persists collapse toggle to localStorage', () => {
  render(
    <LessonPageLayout tree={tree} getLessonHref={getLessonHref as any}>
      <div>Content</div>
    </LessonPageLayout>
  );
  const toggleBtn = screen.getByRole('button', { name: /toggle sidebar/i });
  fireEvent.click(toggleBtn);
  expect(localStorage.getItem('lesson-sidebar-collapsed')).toBe('true');
  fireEvent.click(toggleBtn);
  expect(localStorage.getItem('lesson-sidebar-collapsed')).toBe('false');
});

it('renders without sidebar when tree is undefined', () => {
  render(
    <LessonPageLayout getLessonHref={getLessonHref as any}>
      <div data-testid="content">Content</div>
    </LessonPageLayout>
  );
  expect(screen.getByTestId('content')).toBeInTheDocument();
  expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
});
