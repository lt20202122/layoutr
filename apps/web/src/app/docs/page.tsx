export default function DocsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tool Setup</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configuration snippets for AI coding tools to work with Layoutr.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Claude Code</h2>
        <p className="text-sm text-gray-400">
          Add to <code className="text-gray-300">~/.claude.json</code> or project <code className="text-gray-300">.claude/settings.json</code>:
        </p>
        <pre className="p-4 bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto text-xs font-mono text-gray-300">
{`{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Codex</h2>
        <p className="text-sm text-gray-400">
          Add to <code className="text-gray-300">~/.codex/config.json</code>:
        </p>
        <pre className="p-4 bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto text-xs font-mono text-gray-300">
{`{
  "mcp": {
    "servers": {
      "layoutr": {
        "type": "stdio",
        "command": "npx",
        "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
      }
    }
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cline</h2>
        <p className="text-sm text-gray-400">
          Open Cline settings → MCP Servers → Edit Config, then add:
        </p>
        <pre className="p-4 bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto text-xs font-mono text-gray-300">
{`{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Kilo Code</h2>
        <p className="text-sm text-gray-400">
          Open Kilo Code settings → MCP Servers → Edit Config, then add:
        </p>
        <pre className="p-4 bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto text-xs font-mono text-gray-300">
{`{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">opencode</h2>
        <p className="text-sm text-gray-400">
          Add to <code className="text-gray-300">~/.config/opencode/config.json</code>:
        </p>
        <pre className="p-4 bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto text-xs font-mono text-gray-300">
{`{
  "mcp": {
    "layoutr": {
      "type": "local",
      "command": ["npx", "@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}`}
        </pre>
      </section>
    </div>
  );
}
