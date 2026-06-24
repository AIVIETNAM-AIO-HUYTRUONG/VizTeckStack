/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { PageTreeItem } from './PageTreeItem';
import type { PageTreeNode } from './types';

const lessonNode: PageTreeNode = {
  id: 'n1', title: 'Box Model', type: 'LESSON',
  roadmapSlug: 'html-css', roadmapId: 'r2',
};

const roadmapNode: PageTreeNode = {
  id: 'n2', title: 'HTML & CSS', type: 'ROADMAP',
  slug: 'html-css', targetRoadmapId: 'r2',
  children: [lessonNode],
};

const mockToggle = vi.fn();

it('renders lesson node as a link', () => {
  render(
    <PageTreeItem
      node={lessonNode}
      depth={1}
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  const link = screen.getByRole('link', { name: 'Box Model' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/roadmap/html-css/node/n1');
});

it('renders ROADMAP node with folder icon and expand button', () => {
  render(
    <PageTreeItem
      node={roadmapNode}
      depth={0}
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
      getRoadmapHref={(n) => n.slug ? `/roadmap/${n.slug}` : undefined}
    />
  );
  expect(screen.getByText('HTML & CSS')).toBeInTheDocument();
  const btn = screen.getByRole('button');
  fireEvent.click(btn);
  expect(mockToggle).toHaveBeenCalledWith('n2');
});

it('highlights current node with indigo style', () => {
  render(
    <PageTreeItem
      node={lessonNode}
      depth={1}
      currentNodeId="n1"
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  const link = screen.getByRole('link', { name: 'Box Model' });
  expect(link.className).toContain('text-indigo');
});

it('renders children when isExpanded is true', () => {
  render(
    <PageTreeItem
      node={roadmapNode}
      depth={0}
      isExpanded={true}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  expect(screen.getByText('Box Model')).toBeInTheDocument();
});

it('does not render children when isExpanded is false', () => {
  render(
    <PageTreeItem
      node={roadmapNode}
      depth={0}
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  expect(screen.queryByText('Box Model')).not.toBeInTheDocument();
});
