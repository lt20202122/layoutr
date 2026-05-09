import Link from "next/link";
import {
  Bot,
  Braces,
  Cable,
  ChevronRight,
  KeyRound,
  Rocket,
  TerminalSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AppLogo from "@/components/ui/AppLogo";

const tools: Array<{
  name: string;
  icon: LucideIcon;
  location: string;
  note: string;
  config: string;
}> = [
  {
    name: "Claude Code",
    icon: Bot,
    location: "~/.claude.json or .claude/settings.json",
    note: "Add the MCP server block to your global or project-scoped Claude config.",
    config: `{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`,
  },
  {
    name: "Codex",
    icon: TerminalSquare,
    location: "~/.codex/config.json",
    note: "Use the stdio server entry in Codex config.",
    config: `{
  "mcp": {
    "servers": {
      "layoutr": {
        "type": "stdio",
        "command": "npx",
        "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
      }
    }
  }
}`,
  },
  {
    name: "Cline",
    icon: Cable,
    location: "Cline settings > MCP Servers > Edit Config",
    note: "Open MCP settings in the extension and paste the Layoutr server block.",
    config: `{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`,
  },
  {
    name: "Kilo Code",
    icon: Rocket,
    location: "Kilo Code settings > MCP Servers > Edit Config",
    note: "Add the same Layoutr stdio server in the MCP config editor.",
    config: `{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`,
  },
  {
    name: "opencode",
    icon: Braces,
    location: "~/.config/opencode/config.json",
    note: "Configure Layoutr as a local MCP target in opencode.",
    config: `{
  "mcp": {
    "layoutr": {
      "type": "local",
      "command": ["npx", "@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`,
  },
];

const quickSteps = [
  "Create an API key in Settings.",
  "Paste the matching config block into your coding tool.",
  "Restart the tool so the MCP server is discovered.",
];

export default function DocsPage() {
  return (
    <main className="relative overflow-hidden pb-20 pt-6 sm:pb-24 sm:pt-8">
      <section className="app-shell">
        <div className="glass-panel-strong relative overflow-hidden rounded-[36px] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent" />

          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <AppLogo />
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <Link href="/" className="button-secondary">
                Home
              </Link>
              <Link href="/dashboard" className="button-secondary">
                Workspace
              </Link>
            </div>
          </header>

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_420px] lg:items-start">
            <div className="max-w-3xl">
              <p className="section-label">Docs</p>
              <h1 className="headline-lg mt-5 max-w-3xl text-white">
                Connect Layoutr to your coding agent with one MCP server block.
              </h1>
              <p className="body-lg mt-5 max-w-2xl">
                Every supported tool points at the same local server command. Generate an API key,
                drop in the matching config, and your agent can read and modify projects, sitemaps,
                wireframes, and design tokens directly.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="status-pill">5 tool targets</span>
                <span className="status-pill">stdio MCP transport</span>
                <span className="status-pill">Bearer API key auth</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/settings" className="button-primary">
                  Generate API key
                </Link>
                <a href="#tool-setup" className="button-secondary">
                  Jump to setup
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="glass-panel rounded-[30px] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-brand-300/20 bg-brand-400/10">
                    <KeyRound className="h-5 w-5 text-brand-200" />
                  </div>
                  <div>
                    <p className="section-label">Required first</p>
                    <p className="mt-2 text-base font-semibold text-white">Create a Layoutr API key</p>
                  </div>
                </div>
                <p className="body-sm mt-4">
                  The config snippets below use <code className="text-slate-200">ltr_YOUR_API_KEY</code>.
                  Replace that token with a real key from Settings before you restart your tool.
                </p>
              </div>

              <div className="glass-panel rounded-[30px] p-5">
                <p className="section-label">Quick path</p>
                <div className="mt-4 space-y-3">
                  {quickSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-300/20 bg-brand-400/10 text-xs font-semibold text-brand-100">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell mt-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="glass-panel h-fit rounded-[30px] p-6">
          <p className="section-label">Supported tools</p>
          <div className="mt-5 space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const anchor = `#${tool.name.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <a
                  key={tool.name}
                  href={anchor}
                  className="flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-brand-300" />
                    {tool.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </a>
              );
            })}
          </div>

          <div className="mt-6 rounded-[24px] border border-brand-300/20 bg-brand-400/10 p-4">
            <p className="text-sm font-medium text-brand-50">All tools use the same server package.</p>
            <code className="mt-3 block overflow-x-auto font-mono text-xs text-brand-100">
              npx @layoutr/mcp-server --api-key ltr_YOUR_API_KEY
            </code>
          </div>
        </aside>

        <div id="tool-setup" className="space-y-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const anchor = tool.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <section key={tool.name} id={anchor} className="glass-panel rounded-[30px] p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-brand-300/20 bg-brand-400/10">
                        <Icon className="h-5 w-5 text-brand-200" />
                      </div>
                      <div>
                        <p className="section-label">Tool setup</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{tool.name}</h2>
                      </div>
                    </div>

                    <p className="body-sm mt-5">{tool.note}</p>

                    <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Config location</p>
                      <code className="mt-3 block overflow-x-auto font-mono text-sm text-slate-200">
                        {tool.location}
                      </code>
                    </div>
                  </div>

                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-300">
                    Replace <span className="font-mono text-slate-100">ltr_YOUR_API_KEY</span>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[28px] border border-white/8 bg-[#08111d]">
                  <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Config snippet</p>
                    <div className="status-pill">JSON</div>
                  </div>
                  <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-300 sm:p-5 sm:text-sm">
                    <code>{tool.config}</code>
                  </pre>
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
