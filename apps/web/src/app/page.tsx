import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="5" rx="1.5" fill="white" />
              <rect x="11" y="2" width="7" height="5" rx="1.5" fill="white" opacity="0.6" />
              <rect x="2" y="9" width="16" height="3" rx="1.5" fill="white" opacity="0.4" />
              <rect x="2" y="14" width="10" height="4" rx="1.5" fill="white" opacity="0.7" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">Layoutr</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Sitemaps & wireframes,{" "}
            <span className="text-brand-400">API-first</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Build, manage, and export sitemaps visually or programmatically.
            Native MCP support lets AI agents design alongside you.
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          {[
            { title: "Sitemap Builder", desc: "Tree-based editor with drag & drop" },
            { title: "REST + MCP API", desc: "Full programmatic access for AI agents" },
            { title: "API Keys", desc: "Secure access tokens for integrations" },
          ].map((f) => (
            <div key={f.title} className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-left">
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-gray-400 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
