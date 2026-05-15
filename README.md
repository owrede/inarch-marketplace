# inim-store

**Intelligence Impact AI Plugin Marketplace — a curated registry of agent plugins and skills for [Claude Code](https://docs.claude.com/en/docs/claude-code).**

inim-store is a Claude Code plugin marketplace — a git-hosted registry that bundles slash commands, skills, subagents, MCP servers, and hooks into installable plugins. Add the marketplace once, then install any plugin from it on demand.

The marketplace is currently **empty**. See [Contributing a plugin](#contributing-a-plugin) below to add the first one.

---

## Requirements

- **Claude Code** ≥ the version that ships the plugin system (any recent build).
- **Git** with read access to this repository.
  - inim-store is currently a **private** repo. Make sure your GitHub account has access and that `git clone https://github.com/owrede/inim-store.git` works from your terminal before adding the marketplace.
  - If you use SSH, you can also point at `git@github.com:owrede/inim-store.git`.

You do **not** need to clone the repo manually — Claude Code does that for you when you add the marketplace.

---

## Quick start

```text
/plugin marketplace add owrede/inim-store
/plugin
```

The first command registers the marketplace. The second opens the interactive plugin browser. Once plugins are published here, install one with:

```text
/plugin install <plugin-name>@inim-store
```

---

## Setup in detail

### 1. Register the marketplace

```text
/plugin marketplace add owrede/inim-store
```

Claude Code clones the repo into its plugin cache and reads `.claude-plugin/marketplace.json`. Every plugin listed in that file is now installable.

Alternative source forms:

```text
/plugin marketplace add https://github.com/owrede/inim-store.git
/plugin marketplace add git@github.com:owrede/inim-store.git
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
/plugin install <plugin-name>@inim-store
```

The `@inim-store` suffix scopes the install to this marketplace.

---

## Updating

Pin to `ref: "main"` in plugin entries so updates flow with each commit:

```text
/plugin marketplace update inim-store
```

---

## Removing

```text
/plugin uninstall <plugin-name>@inim-store
/plugin marketplace remove inim-store
```

---

## Repository layout

```
inim-store/
├── .claude-plugin/
│   └── marketplace.json          # Registry: which plugins inim-store offers
├── plugins/                      # One directory per plugin (currently empty)
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
       "url": "https://github.com/owrede/inim-store.git",
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
