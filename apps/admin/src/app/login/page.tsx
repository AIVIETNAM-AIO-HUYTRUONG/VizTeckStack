'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, cn } from '@vizteck/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function MiniGraph() {
  return (
    <svg
      width="180"
      height="144"
      viewBox="0 0 180 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="90" y1="16" x2="54" y2="68" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="90" y1="16" x2="135" y2="68" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="54" y1="68" x2="27" y2="126" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="54" y1="68" x2="81" y2="126" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="135" y1="68" x2="140" y2="126" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <circle cx="90" cy="16" r="8" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="54" cy="68" r="8" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="135" cy="68" r="8" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="27" cy="126" r="8" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      {/* Active node */}
      <circle cx="81" cy="126" r="8" fill="#4F46E5" fillOpacity="0.22" stroke="#4F46E5" strokeOpacity="0.7" strokeWidth="2" />
      <circle cx="140" cy="126" r="8" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
}

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
    <div className="min-h-screen bg-bg-0 flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-[400px] lg:flex-shrink-0 bg-bg-1 border-r border-border flex-col items-center justify-center px-10 py-16">
        <div className="max-w-[260px]">
          <MiniGraph />
          <h2
            className="font-display text-[18px] font-semibold text-text-1 mt-5 mb-2 leading-snug"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Graph-based paths through technical knowledge.
          </h2>
          <p className="text-sm text-text-2 leading-relaxed">
            Build and publish interactive roadmaps that show how topics relate — structured paths educators design, learners navigate.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h1 className="font-display font-semibold text-[20px] text-text-1 mb-1 tracking-tight">
              VizTeck<span className="text-indigo">Stack</span>{' '}Admin
            </h1>
            <p className="text-sm text-text-2">
              Enter your admin token to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-token" className="block text-sm font-semibold text-text-1 mb-1.5">
                Admin token
              </label>
              <input
                ref={inputRef}
                id="admin-token"
                type="password"
                placeholder="••••••••••••"
                autoFocus
                autoComplete="current-password"
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'login-error' : undefined}
                onChange={() => error && setError('')}
                className={cn(
                  'w-full h-10 px-3 text-sm text-text-1 bg-bg-2 border rounded-sm',
                  'placeholder:text-text-3 focus:outline-none focus:ring-2 transition-colors motion-reduce:transition-none',
                  error
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-border focus:ring-indigo focus:border-indigo',
                )}
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
    </div>
  );
}
