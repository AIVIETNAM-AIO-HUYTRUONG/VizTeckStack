import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchModal } from './useSearchModal';

describe('useSearchModal', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useSearchModal());
    expect(result.current.open).toBe(false);
  });

  it('opens on Ctrl+K', () => {
    const { result } = renderHook(() => useSearchModal());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(result.current.open).toBe(true);
  });

  it('opens on Cmd+K (metaKey)', () => {
    const { result } = renderHook(() => useSearchModal());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    });
    expect(result.current.open).toBe(true);
  });

  it('toggles closed when already open on Ctrl+K', () => {
    const { result } = renderHook(() => useSearchModal());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(result.current.open).toBe(false);
  });

  it('setOpen(false) closes the modal', () => {
    const { result } = renderHook(() => useSearchModal());
    act(() => {
      result.current.setOpen(true);
    });
    act(() => {
      result.current.setOpen(false);
    });
    expect(result.current.open).toBe(false);
  });
});
