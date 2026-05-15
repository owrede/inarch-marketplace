# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

inim-store is a **Claude Code plugin marketplace** — a git-hosted registry, not a software project. It distributes plugins (bundles of slash commands, skills, subagents, MCP servers, hooks) that users install via `/plugin install <name>@inim-store`.

There is no build, no test suite, and no runtime. Validation is structural: does the JSON parse, do referenced paths exist, do plugin manifests match the marketplace entry.

## Architecture

Two coupled sources of truth:

1. **`.claude-plugin/marketplace.json`** — the registry index. Each entry in `plugins[]` declares a plugin's name, version, category, and a `source` block (typically `git-subdir` pointing at `plugins/<name>` on `ref: main`). This file is what Claude Code reads when a user adds the marketplace.

2. **`plugins/<plugin-name>/`** — one directory per plugin. Each must contain `.claude-plugin/plugin.json` (with `name`, `version`, `description`, `author`) plus any capability dirs: `commands/`, `skills/`, `agents/`, `mcp/`, `hooks/`.

**The invariant**: every entry in `marketplace.json` must have a matching `plugins/<name>/.claude-plugin/plugin.json` whose `name` and `version` agree. Adding a plugin means editing both — drop the directory, then append to `marketplace.json`. Removing a plugin means deleting both.

The marketplace is currently empty (`plugins: []`, `plugins/` contains only `.gitkeep`).

## Working in this repo

- **Plugin names are kebab-case.** Skill descriptions must be sharp — they're the signal the model uses to decide whether to invoke a skill, so write them as triggers ("Use when the user says X").
- **Don't bundle large binaries.** Fetch on demand or reference externally.
- **`plugins/inim-marketplace/` and `plugins/inim-marketplace-*/` are gitignored.** These are private meta-management tooling for maintaining this marketplace and must never be published through it. There is a corresponding user-level skill `/inim-marketplace` that scaffolds new marketplaces and syncs them to GitHub — invoke that skill when the user asks to bootstrap or manage marketplace repos.
- **No `cd plugins/foo && ...` builds.** Plugins are static files consumed by Claude Code; treat changes as content edits, not compilations.

## Common operations

- **Add a plugin**: create `plugins/<name>/.claude-plugin/plugin.json` and capability dirs → append entry to `marketplace.json` `plugins[]` with `source.source: "git-subdir"`, `source.path: "plugins/<name>"`, `source.ref: "main"`.
- **Update a plugin**: bump `version` in both the plugin's `plugin.json` and its `marketplace.json` entry.
- **Validate**: `jq . .claude-plugin/marketplace.json` (parse check) and confirm each `plugins[].source.path` resolves to a real directory with a valid `plugin.json`.

## Repo conventions

- The repo is currently **private**. Installation requires GitHub access to `owrede/inim-store`.
- Pin plugin entries to `ref: "main"` so `/plugin marketplace update inim-store` flows changes through.
- Contribution flow is README §"Contributing a plugin" — fork, branch from `main`, PR.
