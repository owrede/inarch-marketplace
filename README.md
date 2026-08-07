# inarch-marketplace

**Intelligence Architects plugin marketplace — a curated registry of agent plugins and skills for [Claude Code](https://docs.claude.com/en/docs/claude-code).**

inarch-marketplace is a Claude Code plugin marketplace — a git-hosted registry that bundles slash commands, skills, subagents, MCP servers, and hooks into installable plugins. Add the marketplace once, then install any plugin from it on demand.

## Plugins

| Plugin | What it does |
|---|---|
| [`inarch-genui`](plugins/inarch-genui) | The Intelligence Architects UI pattern library over MCP: find the house answer for a screen, list, form, dialog or navigation structure, install it as code, propose one back. **Needs a token** — see below. |
| [`vmem`](plugins/vmem) | Local-first agentic memory for Obsidian: install, diagnose and reindex vault-memory from Claude Code. |
| `install-vault-memory` | Deprecated — use `vmem`. |

`inarch-genui` is the one plugin here that cannot work on its own: every tool
call reaches a pattern library that requires a token. Sign in at
[genui.intelligence-architects.com](https://genui.intelligence-architects.com),
open **Settings → Connect a coding agent**, and issue one. That screen also
gives you a ready-made install prompt, which is the shorter route than this
marketplace if you have an account.

---

## Requirements

- **Claude Code** ≥ the version that ships the plugin system (any recent build).
- **Git** with read access to this repository.
  - inarch-marketplace is a **public** repo, so no account or access grant is needed to add it. (It was private during setup; if you were told otherwise, that is out of date.)
  - If you use SSH, you can also point at `git@github.com:owrede/inarch-marketplace.git`.

You do **not** need to clone the repo manually — Claude Code does that for you when you add the marketplace.

---

## Quick start

```text
/plugin marketplace add owrede/inarch-marketplace
/plugin
```

The first command registers the marketplace. The second opens the interactive plugin browser. Once plugins are published here, install one with:

```text
/plugin install <plugin-name>@inarch-marketplace
```

---

## Setup in detail

### 1. Register the marketplace

```text
/plugin marketplace add owrede/inarch-marketplace
```

Claude Code clones the repo into its plugin cache and reads `.claude-plugin/marketplace.json`. Every plugin listed in that file is now installable.

Alternative source forms:

```text
/plugin marketplace add https://github.com/owrede/inarch-marketplace.git
/plugin marketplace add git@github.com:owrede/inarch-marketplace.git
```

### 2. Browse what's available

```text
/plugin
```

To list marketplaces you've added:

```text
/plugin marketplace list
```

### 3. Install a plugin

```text
/plugin install <plugin-name>@inarch-marketplace
```

The `@inarch-marketplace` suffix scopes the install to this marketplace.

---

## Updating

Pin to `ref: "main"` in plugin entries so updates flow with each commit:

```text
/plugin marketplace update inarch-marketplace
```

---

## Removing

```text
/plugin uninstall <plugin-name>@inarch-marketplace
/plugin marketplace remove inarch-marketplace
```

---

## Repository layout

```
inarch-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Registry: which plugins inarch-marketplace offers
├── plugins/                      # One directory per plugin
│   ├── inarch-genui/             # UI pattern library over MCP
│   ├── vmem/                     # Obsidian vault memory
│   └── install-vault-memory/     # deprecated, use vmem
├── CLAUDE.md
├── README.md
└── LICENSE
```

---

## Contributing a plugin

1. **Fork & branch.** Branch from `main`.
2. **Create the plugin directory** under `plugins/<your-plugin-name>/`.
3. **Add `.claude-plugin/plugin.json`** with at minimum `name`, `version`, `description`, `author`.
4. **Add capabilities** — any combination of `commands/`, `skills/`, `agents/`, `mcp/`, `hooks/`.
5. **Register the plugin** by appending an entry to `.claude-plugin/marketplace.json`:
   ```json
   {
     "name": "your-plugin-name",
     "description": "What it does",
     "version": "0.1.0",
     "category": "development",
     "source": {
       "source": "git-subdir",
       "url": "https://github.com/owrede/inarch-marketplace.git",
       "path": "plugins/your-plugin-name",
       "ref": "main"
     }
   }
   ```
6. **Test locally** by adding your fork as a marketplace: `/plugin marketplace add <your-fork-url>`.
7. **Open a PR** with a short description.

Conventions:

- Plugin names are kebab-case.
- Keep skill descriptions sharp — they're how the model decides whether to invoke a skill.
- Don't bundle large binaries; reference them or fetch on demand.

---

## License

MIT — see [LICENSE](./LICENSE).
