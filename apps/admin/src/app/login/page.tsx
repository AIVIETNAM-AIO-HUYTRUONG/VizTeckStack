'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vizteck/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
    const stored = localStorage.getItem('admin_token');
    if (stored) {
      router.replace('/roadmaps');
    }
  }, [router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const tokenValue = inputRef.current?.value ?? '';
    if (!tokenValue.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/admin/validate`, {
        headers: { Authorization: `Bearer ${tokenValue}` },
      });

      if (res.ok) {
        localStorage.setItem('admin_token', tokenValue);
        router.push('/roadmaps');
      } else if (res.status === 401) {
        setError('Invalid token. Please try again.');
        if (inputRef.current) inputRef.current.value = '';
        inputRef.current?.focus();
      } else {
        setError('Could not reach server. Check your connection.');
      }
    } catch {
      setError('Could not reach server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }

  return (
    <div className="min-h-screen bg-bg-0 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] bg-bg-1 border border-border rounded-md p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display font-semibold text-[20px] text-text-1 mb-1">
            VizTeckStack Admin
          </h1>
          <p className="text-sm text-text-2">
            Enter your admin token to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-token" className="block text-sm font-semibold text-text-1 mb-1">
              Admin token
            </label>
            <input
              ref={inputRef}
              id="admin-token"
              type="password"
              onKeyDown={handleKeyDown}
              placeholder="Enter your token"
              autoFocus
              className="w-full h-10 px-3 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            variant="primary"
            disabled={loading}
            onClick={handleSubmit}
            data-ready={hydrated ? 'true' : undefined}
            style={{ width: '100%', height: 40, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
