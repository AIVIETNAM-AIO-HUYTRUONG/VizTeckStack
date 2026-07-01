import { SignIn } from '@clerk/nextjs';

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
      <line x1="90" y1="16" x2="54" y2="68" stroke="#4F46E5" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="90" y1="16" x2="135" y2="68" stroke="#4F46E5" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="54" y1="68" x2="27" y2="126" stroke="#4F46E5" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="54" y1="68" x2="81" y2="126" stroke="#4F46E5" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="135" y1="68" x2="140" y2="126" stroke="#4F46E5" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="90" cy="16" r="8" fill="#4F46E5" fillOpacity="0.12" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="54" cy="68" r="8" fill="#4F46E5" fillOpacity="0.12" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="135" cy="68" r="8" fill="#4F46E5" fillOpacity="0.12" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="27" cy="126" r="8" fill="#4F46E5" fillOpacity="0.12" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="81" cy="126" r="9" fill="#4F46E5" fillOpacity="0.2" stroke="#4F46E5" strokeOpacity="0.75" strokeWidth="2" />
      <circle cx="140" cy="126" r="8" fill="#4F46E5" fillOpacity="0.12" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-0 flex">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-[420px] lg:flex-shrink-0 bg-bg-1 border-r border-border flex-col items-center justify-center px-10 py-16">
        <div className="max-w-[280px]">
          <div className="mb-6">
            <span className="font-display font-semibold text-[22px] text-text-1 tracking-tight">
              VizTeck<span className="text-indigo">Stack</span>
            </span>
          </div>
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

      {/* Right panel — Clerk SignIn */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile brand */}
        <div className="lg:hidden mb-8 text-center">
          <span className="font-display font-semibold text-[22px] text-text-1 tracking-tight">
            VizTeck<span className="text-indigo">Stack</span>{' '}
            <span className="text-text-2 font-normal">Admin</span>
          </span>
        </div>

        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#4F46E5',
              colorBackground: 'var(--bg-1, #f9f9fb)',
              colorForeground: 'var(--text-1, #111118)',
              colorMutedForeground: 'var(--text-2, #5c5c7a)',
              colorNeutral: 'var(--text-2, #5c5c7a)',
              colorInput: 'var(--bg-2, #f1f1f5)',
              colorInputForeground: 'var(--text-1, #111118)',
              borderRadius: '0.375rem',
              fontFamily: 'var(--font-body, Inter, sans-serif)',
            },
            elements: {
              card: 'shadow-none border border-[var(--border,#e4e4ef)] rounded-md',
              headerTitle: 'font-display font-semibold text-text-1',
              headerSubtitle: 'text-text-2',
              socialButtonsBlockButton: 'border border-[var(--border,#e4e4ef)] hover:bg-[var(--bg-2)] transition-colors',
              formFieldInput: 'border-[var(--border,#e4e4ef)] focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]',
              footerActionLink: 'text-[#4F46E5] hover:text-[#6366F1]',
            },
          }}
        />
      </div>
    </div>
  );
}
