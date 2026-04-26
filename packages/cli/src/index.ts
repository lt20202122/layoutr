#!/usr/bin/env node
/**
 * layoutr init — Detect AI coding agent config files and inject the
 * Layoutr MCP server configuration into each one.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { homedir, platform } from "os";
import * as readline from "readline";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function readJsonFile(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeJsonFile(path: string, data: Record<string, unknown>): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function vscodeSettingsPath(): string {
  const home = homedir();
  switch (platform()) {
    case "win32":
      return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Code", "User", "settings.json");
    case "darwin":
      return join(home, "Library", "Application Support", "Code", "User", "settings.json");
    default:
      return join(home, ".config", "Code", "User", "settings.json");
  }
}

// ─── MCP server config block ─────────────────────────────────────────────────

function mcpServerConfig(apiKey: string) {
  return {
    command: "npx",
    args: ["-y", "@layoutr/mcp-server"],
    env: {
      LAYOUTR_API_KEY: apiKey,
    },
  };
}

// ─── Detection + injection ────────────────────────────────────────────────────

type InjectionResult = { agent: string; path: string; status: "injected" | "already_present" | "skipped" };

async function injectClaudeCode(apiKey: string): Promise<InjectionResult[]> {
  const results: InjectionResult[] = [];

  const paths = [
    join(homedir(), ".claude.json"),
    join(process.cwd(), ".claude", "settings.json"),
  ];

  for (const p of paths) {
    if (!existsSync(p)) continue;
    const config = readJsonFile(p);

    const mcpServers = (config.mcpServers as Record<string, unknown>) ?? {};
    if (mcpServers["layoutr"]) {
      results.push({ agent: "Claude Code", path: p, status: "already_present" });
      continue;
    }

    mcpServers["layoutr"] = mcpServerConfig(apiKey);
    config.mcpServers = mcpServers;
    writeJsonFile(p, config);
    results.push({ agent: "Claude Code", path: p, status: "injected" });
  }

  return results;
}

async function injectCodex(apiKey: string): Promise<InjectionResult[]> {
  const p = join(homedir(), ".codex", "config.yaml");
  if (!existsSync(p)) return [];

  const raw = readFileSync(p, "utf8");
  const config = (parseYaml(raw) as Record<string, unknown>) ?? {};

  const mcpServers = (config.mcpServers as Record<string, unknown>) ?? {};
  if (mcpServers["layoutr"]) {
    return [{ agent: "Codex", path: p, status: "already_present" }];
  }

  mcpServers["layoutr"] = mcpServerConfig(apiKey);
  config.mcpServers = mcpServers;
  writeFileSync(p, stringifyYaml(config), "utf8");
  return [{ agent: "Codex", path: p, status: "injected" }];
}

async function injectVSCodeMcp(apiKey: string): Promise<InjectionResult[]> {
  const p = vscodeSettingsPath();
  if (!existsSync(p)) return [];

  const config = readJsonFile(p);
  const mcpServers = (config["mcp.servers"] as Record<string, unknown>) ?? {};

  if (mcpServers["layoutr"]) {
    return [{ agent: "Cline/Kilo Code (VS Code)", path: p, status: "already_present" }];
  }

  mcpServers["layoutr"] = mcpServerConfig(apiKey);
  config["mcp.servers"] = mcpServers;
  writeJsonFile(p, config);
  return [{ agent: "Cline/Kilo Code (VS Code)", path: p, status: "injected" }];
}

async function injectOpencode(apiKey: string): Promise<InjectionResult[]> {
  const p = join(homedir(), ".config", "opencode", "config.json");
  if (!existsSync(p)) return [];

  const config = readJsonFile(p);
  const mcpServers = (config.mcpServers as Record<string, unknown>) ?? {};

  if (mcpServers["layoutr"]) {
    return [{ agent: "opencode", path: p, status: "already_present" }];
  }

  mcpServers["layoutr"] = mcpServerConfig(apiKey);
  config.mcpServers = mcpServers;
  writeJsonFile(p, config);
  return [{ agent: "opencode", path: p, status: "injected" }];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n  🗺  Layoutr MCP Setup\n");
  console.log("  This will inject the Layoutr MCP server into detected AI coding agents.\n");

  // ── Get API key ──────────────────────────────────────────────────────────
  let apiKey = process.env.LAYOUTR_API_KEY ?? "";

  if (!apiKey) {
    console.log("  Your Layoutr API key starts with ltr_");
    console.log("  Get one at: https://layoutr.app/settings\n");
    apiKey = await question("  Enter your Layoutr API key: ");
  } else {
    console.log(`  Using LAYOUTR_API_KEY from environment (${apiKey.slice(0, 12)}...)\n`);
  }

  if (!apiKey.startsWith("ltr_")) {
    console.error("\n  ❌ Invalid API key — must start with ltr_\n");
    process.exit(1);
  }

  // ── Run detection + injection ────────────────────────────────────────────
  console.log("\n  Scanning for AI agent config files...\n");

  const allResults = (
    await Promise.all([
      injectClaudeCode(apiKey),
      injectCodex(apiKey),
      injectVSCodeMcp(apiKey),
      injectOpencode(apiKey),
    ])
  ).flat();

  // ── Print summary ────────────────────────────────────────────────────────
  if (allResults.length === 0) {
    console.log("  ⚠  No supported AI agent config files found.\n");
    console.log("  Supported agents:");
    console.log("    • Claude Code  (~/.claude.json or .claude/settings.json)");
    console.log("    • Codex        (~/.codex/config.yaml)");
    console.log("    • Cline/Kilo   (VS Code settings.json, mcp.servers key)");
    console.log("    • opencode     (~/.config/opencode/config.json)\n");
    console.log("  You can also configure the MCP server manually:");
    console.log(`    npx @layoutr/mcp-server --api-key ${apiKey}\n`);
    return;
  }

  console.log("  Results:\n");
  for (const r of allResults) {
    const icon = r.status === "injected" ? "✅" : r.status === "already_present" ? "✓ " : "⏭ ";
    const label =
      r.status === "injected"
        ? "Injected"
        : r.status === "already_present"
        ? "Already configured"
        : "Skipped";
    console.log(`  ${icon}  ${r.agent.padEnd(28)} ${label}`);
    console.log(`       ${r.path}`);
    console.log();
  }

  const injected = allResults.filter((r) => r.status === "injected").length;
  if (injected > 0) {
    console.log(`  ✨ Done! Injected into ${injected} agent(s).`);
    console.log("     Restart your agent to load the new MCP server.\n");
  } else {
    console.log("  ✓ All agents already have Layoutr configured.\n");
  }
}

main().catch((err: unknown) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
