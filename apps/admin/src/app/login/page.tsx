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
    if (stored) router.replace('/roadmaps');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
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
        setError('Could not reach server. Check your connection and try again.');
      }
    } catch {
      setError('Could not reach server. Check your connection and try again.');
    } finally {
      setLoading(false);
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
              placeholder="Enter your token"
              autoFocus
              autoComplete="current-password"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'login-error' : undefined}
              onChange={() => error && setError('')}
              className={`w-full h-10 px-3 text-sm text-text-1 bg-bg-2 border rounded-sm focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-border focus:ring-indigo focus:border-indigo'
              }`}
            />
          </div>

          {error && (
            <p id="login-error" className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={loading || !hydrated}
            className="w-full"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
