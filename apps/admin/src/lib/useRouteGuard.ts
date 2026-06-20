'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseUnsavedGuardReturn {
  /** Whether the navigation confirm dialog should be shown */
  showConfirm: boolean;
  /** Call this to imperatively check if navigation is safe. Returns true if allowed. */
  confirmNavigation: () => boolean;
  /** Dismiss the confirm dialog and stay on the page */
  cancelNavigation: () => void;
  /** Confirm leaving — call the pending navigation action and hide dialog */
  proceedNavigation: () => void;
}

/**
 * Registers a beforeunload listener when dirty and provides an imperative
 * confirmNavigation() helper for in-app navigation gating.
 *
 * Usage:
 *   const { showConfirm, confirmNavigation, cancelNavigation, proceedNavigation } = useUnsavedGuard(dirty);
 *   // In back link click: if (confirmNavigation()) router.push('/roadmaps');
 *   // Render: {showConfirm && <ConfirmDialog ... />}
 */
export function useUnsavedGuard(isDirty: boolean): UseUnsavedGuardReturn {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Browser close / refresh guard
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore the returnValue string but still show a dialog
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Reset dialog state when no longer dirty
  useEffect(() => {
    if (!isDirty) {
      setShowConfirm(false);
      setPendingAction(null);
    }
  }, [isDirty]);

  const confirmNavigation = useCallback((): boolean => {
    if (!isDirty) return true;
    // Show dialog — return false (navigation blocked pending user choice)
    setShowConfirm(true);
    return false;
  }, [isDirty]);

  const cancelNavigation = useCallback(() => {
    setShowConfirm(false);
    setPendingAction(null);
  }, []);

  const proceedNavigation = useCallback(() => {
    setShowConfirm(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  return { showConfirm, confirmNavigation, cancelNavigation, proceedNavigation };
}
