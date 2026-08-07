# inarch-genui — Agent Plugin

An [Agent Plugins 1.0.0](https://agent-plugins.org/) package that gives a coding
agent the Intelligence Architects pattern library: the house answer for a
screen, list, form, dialog or navigation structure, as installable code, plus
the path back when the library has no answer yet.

```
plugin/
├── plugin.json                     identity and metadata
├── mcp.json                        one stdio server, no credentials
├── bin/genui-mcp-bridge.mjs         stdio ⇄ MCP-over-HTTP
└── skills/
    ├── genui-patterns/SKILL.md     when and how to consult the library
    └── genui-import/SKILL.md       growing the library from outside sources
```

## Install

Point your client's plugin loader at this directory (the mechanism is
client-specific; Agent Plugins deliberately leaves distribution and
installation to each client). Then set one environment variable:

```sh
export GENUI_MCP_TOKEN="…"     # ask a curator, or: node bin/genui-token.js
```

Against a different deployment, override the endpoint too:

```sh
export GENUI_MCP_URL="https://genui.example.com/mcp"
```

Verify without a client:

```sh
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n' \
  | GENUI_MCP_TOKEN="$GENUI_MCP_TOKEN" node plugin/bin/genui-mcp-bridge.mjs
```

Twenty-six tools come back when it works. Without a token you get a JSON-RPC
error saying so, not a crash — a bridge that exited on a bad token would take
the whole MCP connection down and send whoever debugs it looking at the network
instead of at their configuration.

## Why a bridge instead of a direct HTTP entry

The deployment's `/mcp` endpoint authenticates with `Authorization: Bearer
<token>`, and `mcp.json` could declare `streamable-http` with that header in
two lines. It must not: Agent Plugins 1.0.0 states that configured headers are
*"literal, visible package data and must not contain credentials or secrets"*,
and defines no portable field for a credential reference — authentication is
client-managed by design.

A token committed here would reach every clone of every repository this plugin
is installed from, and revoking it would break all of them at once. So the
transport is stdio, the token is read from the environment at run time, and the
package carries nothing secret. The cost is one Node process per session.

`bin/genui-plugin.js` enforces this: a header that looks like a credential, or
an `env` entry with a literal secret-shaped value, fails the check.

## What the agent can do with it

| Job | Tools |
|---|---|
| Find the house answer | `search_patterns` (by situation, not keywords), `identify_pattern` |
| Use it | `get_pattern`, `get_component`, `get_install_command`, `list_targets` |
| Decide reuse vs. build | `assess_fit`, `find_redundancy`, `get_related_patterns` |
| Rebuild existing UI | `scan_codebase`, `identify_pattern`, `check_pattern_revisions` |
| Feed the library back | `propose_pattern`, `propose_change`, `report_retrieval_miss` |
| Curate | `list_open_comments`, `claim_comments`, `resolve_comment`, `review_proposal` |

What an agent is permitted to do depends on the role its token carries, not on
the plugin:

| Role | Read | Propose / comment | Decide |
|---|---|---|---|
| `viewer` | yes | no | no |
| `submitter` | yes | yes | no |
| `reviewer` | yes | yes | no |
| `curator`, `admin` | yes | yes | yes |

So an agent that should be able to propose a pattern or leave a comment needs
**at least `submitter`** — `viewer` reads everything and writes nothing.

All twenty-six tools are always listed regardless of role. Permission is
checked at the call, so a refusal is an explicit answer the agent can report,
rather than a tool that silently does not exist.

## Keeping it current

The two skills are **generated** from `skill/` at the repository root, which is
what this deployment also serves over `/skill`. Editing the copies under
`plugin/skills/` is the wrong move — they are overwritten.

```sh
node bin/genui-plugin.js           # rebuild from source, then validate
node bin/genui-plugin.js --check   # validate only; fails if the copies are stale
```

The `--check` form belongs in CI. Two hand-maintained copies drift silently:
the plugin keeps shipping last month's instructions while the served skill
moves on, and nothing reports it because an outdated skill is still a valid
one.

## Conformance notes

- **Manifest schema is closed.** An unknown top-level field is a schema
  violation; clients report and ignore it. Client-specific data belongs under
  `extensions`, keyed by reverse-domain namespace.
- **`command` is one executable token** and placeholders are *not* expanded in
  it. `${PLUGIN_ROOT}/bin/x.js` as a command reaches the OS literally and fails
  to resolve — the path goes in `args`, which is expanded.
- **A skill's frontmatter `name` must match its directory.** A mismatch does
  not warn anywhere; the skill simply never loads.
- **Failure is isolated.** An invalid `mcp.json` disables MCP for the plugin
  but leaves skills loading, and one bad skill does not take the others down.
