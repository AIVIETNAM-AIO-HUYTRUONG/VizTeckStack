import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchModal } from './SearchModal';
import { MockedProvider } from '@apollo/client/testing';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  getLessonHref: (slug: string, nodeId: string) => `/roadmap/${slug}/node/${nodeId}`,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MockedProvider mocks={[]} addTypename={false}>{children}</MockedProvider>;
}

describe('SearchModal', () => {
  it('renders search input when open', () => {
    render(<Wrapper><SearchModal {...defaultProps} /></Wrapper>);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Wrapper><SearchModal {...defaultProps} open={false} /></Wrapper>);
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Wrapper><SearchModal {...defaultProps} onClose={onClose} /></Wrapper>);
    fireEvent.click(screen.getByTestId('search-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Title only button toggles filter', () => {
    render(<Wrapper><SearchModal {...defaultProps} /></Wrapper>);
    const btn = screen.getByRole('button', { name: /title only/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(btn).toHaveClass('text-indigo');
  });
});
