---
name: genui-patterns
description: "Consult the Intelligence Architects pattern library before building any UI — a screen, a view, a form, a list, a dialog, or a navigation structure. Use when the task involves creating or modifying user interface code, so the result matches how the org already builds things rather than being reinvented."
---

# GenUI pattern library

Before you write UI code, ask the library what the house answer is.

The library holds **orchestration knowledge** — how elements are composed into
a working screen — not components. Your component library already tells you
what a button is. This tells you how a *filtered list of things a user acts on*
is put together here, so the result matches the org's other products instead of
being a fresh invention every time.

One narrow exception: where the base component library has no answer at all,
the library carries the control itself. Those arrive with `get_pattern` when a
pattern needs one, and `list_components` shows the whole set.

## When to consult it

**Always, before writing UI code.** Specifically when the task involves:

- a screen, view, page, or route
- a list, table, grid, or anything filtered
- a form, a dialog, a confirmation
- navigation, a shell, a header, a sidebar
- an empty, loading, or error state

**Skip it** for pure logic, data-layer work, or a one-line style change.

## Which tool, when

Two different jobs, and reaching for the wrong entry point is the most common
way this library gets used badly.

**Writing something new** — you have a need in words:

```
search_patterns   → get_pattern → build → annotate
assess_fit        when you must judge whether a near-match is near ENOUGH
```

**Rebuilding something that exists** — you have code in front of you:

```
scan_codebase     inventory first, one entry per screen or component
identify_pattern  per piece: which pattern is this ALREADY?
propose_pattern   when the answer is genuinely "the library has none"
```

Do not use `search_patterns` on existing code. Code and patterns are written in
different languages, and the gap is large enough to invert the decision — the
measurements are in §1a.

**Whatever you are doing:**

| Tool | When |
|---|---|
| `get_component` | The pattern names a control your UI library lacks |
| `check_pattern_revisions` | Maintaining code that already carries `@genui` lines |
| `report_retrieval_miss` | The library answered wrongly, or not at all |
| `find_redundancy` | Curating — is the library saying the same thing twice? |

## Connecting from another project

**Over the network (what most people want).** Ask the library's curator for a
token; it looks like `genui_…`. Nothing to install, no database:

```json
{
  "mcpServers": {
    "genui": {
      "type": "http",
      "url": "https://genui.intelligence-architects.com/mcp",
      "headers": { "Authorization": "Bearer genui_YOUR_TOKEN" }
    }
  }
}
```

The token carries your account's tenant and role — it cannot see more than you
can, and it can be revoked without touching anything else. Treat it like a
password: it belongs in a config file you do not commit.

**Globally over stdio**, if you have a checkout and your own database. Put this
in `~/.claude.json` under `mcpServers` and every project on the machine can
consult the library without its own config.

The path must be **absolute**. The repo's own `.mcp.json` uses a relative one,
which resolves only when the server is launched from the genui checkout — a
global entry copied from it fails in every other project, and fails at connect
time with nothing pointing at the cause:

```json
{
  "mcpServers": {
    "genui": {
      "command": "node",
      "args": ["/absolute/path/to/inarch-genui/src/mcp/stdio.js"],
      "env": { "GENUI_TENANT": "inarch", "GENUI_DB": "genui_dev" }
    }
  }
}
```

Both transports expose the identical tools; only the credential differs.

Copy this file to `.claude/skills/genui-patterns/SKILL.md` in that project so
the workflow travels with the connection.

```bash
curl -H "Authorization: Bearer genui_YOUR_TOKEN" \
  https://genui.intelligence-architects.com/skill > SKILL.md
```

**A second skill covers the other direction — filling the library rather than
consuming it.** `/skill/import` teaches an agent how to bring patterns in from
shadcn registries and blocks, published pattern libraries, an existing
codebase, Figma, or any web page. Fetch it when the task is growing the corpus:

```bash
curl -H "Authorization: Bearer genui_YOUR_TOKEN" \
  https://genui.intelligence-architects.com/skill/import
```

## How to use it

### 0. Once per project: read the design guide

```
get_design_guide({ target: "react-shadcn" })   // target optional
get_guidelines()                                // the full reference
```

`get_design_guide` returns DESIGN.md for the target: which component library
to use, the theme and its tokens, and the layout rules generated UI must
follow. Read it **before** writing any UI code — the patterns say how elements
compose, this says what the result should look like.

`get_guidelines` returns the long-form reference: how to annotate what you
build, how to record customizations so they survive a pattern update, and how
to propose a change. Fetch it when something does not fit rather than
memorising it.

Both are generated live. Fetch them; do not copy them into the repo, or they
go stale without saying so.

### 1. Search with the situation, not with keywords

```
search_patterns({
  intent: "let a user narrow a large collection and act on rows",
  containment: "view",          // optional but sharpens the result
  target: "react-shadcn"        // omit if you do not know; use list_targets
})
```

`intent` is prose. Describe **what the user needs to accomplish**, not what
component you were planning to reach for. "let a returning user authenticate"
retrieves better than "login form".

### 1a. Rebuilding existing UI? A different loop

Four tools, in this order:

```
scan_codebase({ pieces: [ {label, description, location}, … ] })
identify_pattern({ description: "what this code does, in your words" })
assess_fit({ need: "…" })          // when you have a need, not code
propose_pattern({ … })             // when the library genuinely has none
```

**Start with `identify_pattern`, not `search_patterns`,** and do not treat it
as a formality. Code and patterns are written in different languages, and the
gap is wide enough to invert the decision. Measured on the real corpus:

| Situation | Phrased as code | Phrased as purpose |
|---|---|---|
| filterable user table | `faceted-list` **0.26** | **0.56** |
| sign-in form | `authentication-gate` **0.33** | **0.52** |
| collapsible sidebar | `expandable-row-table` **0.27** ← wrong pattern | `sidebar-nav-2level` **0.68** |
| destructive modal | `confirm-destructive` **0.39** | **0.67** |

The reuse threshold is 0.42. Every code-phrased score falls below it, so an
agent describing what it literally sees is told to build new — for patterns the
library already has. The sidebar case is worse than a miss: it retrieves the
*wrong* pattern, confidently.

`identify_pattern` closes that gap before anything is measured, and reports
`vocabulary_added` so you can see what it understood.

**Watch for `borderline`.** It means the score landed just under the threshold
while enrichment was still raising it — the library probably does have this and
your wording is what falls short. Read the closest pattern's `context` and
`anti_patterns` before deciding to build new.

Search answers *what is near this*. Rebuilding also demands *is near enough,
near enough* — piece by piece, dozens of times over one codebase. That is the
judgement agents make inconsistently, and a small bias compounds into a product
that shares nothing with the others.

### 1b. When the library genuinely has no answer: `propose_pattern`

```
propose_pattern({
  name: "Timeline Editor",
  intent: "let a user splice audio regions on a timeline",
  context: "an audio editor where regions are trimmed and rearranged",
  description: "…how it is actually put together…",
  interaction_contract: { keyboard, roles, focus, announcements,
                          direction, localisation },
  related_to: "property-inspector",       // record the nearest neighbour
  relation_type: "commonly_paired_with"
})
```

Call this **after** you built the thing, from what you actually implemented.
Without it a discovered gap ends as a sentence in a chat log and the next agent
rediscovers it.

The pattern is created at **`proposed`** maturity: usable immediately, so your
rebuild is not blocked waiting for review — but ranked below everything
reviewed (weight 0.7 against `stable`'s 1.0) and endorsed by nobody. It has no
preview, no adherence scoring, and has not passed the accessibility gate.

`interaction_contract` is required even here. You know the keyboard model you
implemented; nobody reading the pattern in three months can reconstruct it.

**Annotate what you built with the returned line.** If a curator later rejects
or reshapes the pattern, that annotation is the only record of which code
depends on it.

Record `related_to`. An unexplained resemblance is exactly what
`find_redundancy` later flags, and the relation is what prevents that.

You get a route, the measured similarity behind it, and the reasons the other
routes lost:

| Route | What it means |
|---|---|
| `reuse_as_is` | The pattern describes your situation. Deviating needs a reason |
| `reuse_with_customization` | Right shape, different details — `customization_contract` absorbs those |
| `new_pattern` | Related but not answering your situation, or nothing close at all |
| `inspect_manually` | The comparison could not be made on meaning. Read the candidate yourself |

**Reuse is the default and it is not unconditional.** When a pattern genuinely
cannot express what the screen needs, forcing it is the worse outcome — the
contract stops holding on the first screen. Two fields carry that boundary:

- `escalate_if` on `reuse_with_customization` — if the contract does not cover
  your variation *but the variation does not change what the pattern promises*,
  the contract is too narrow. Widening it is **additive**: nothing built on the
  pattern today stops being conformant.
- `caution` on `new_pattern` — check first whether only a **control** is
  missing rather than a whole pattern. `add_component` is smaller and more
  reusable than a near-duplicate pattern.

It recommends; you decide. If you depart from the route, say so in your reply
and record why — a departure with a stated reason is information, one made
silently is not.

### 2. Read the answer honestly

The response may contain a `standard`:

```json
{ "standard": { "name": "Faceted List", … },
  "standard_note": "… is the tenant standard for this situation …",
  "results": [ … alternatives … ] }
```

- **A marked standard is the house answer.** Use it unless you have a specific
  reason not to.
- **If you depart from it, say so in your response to the user** — you are
  departing from the design system, and they should know.
- The alternatives are still listed. You choose; the library does not choose
  for you.

### 3. Fetch the whole pattern before building

```
get_pattern({ slug: "faceted-list", target: "react-shadcn" })
```

Then read these, in this order:

| Field | What to do with it |
|---|---|
| `context` | Confirm the situation actually matches. If it does not, search again |
| `anti_patterns` | **Check first.** If one applies, this is the wrong pattern |
| `forces` | The trade-offs. These tell you *why* it is shaped this way |
| `interaction_contract` | Keyboard model, roles, focus, announcements — **implement all of it** |
| `content_slots` | Which states you must handle. Guidance, not wording — write the words yourself |
| `customization_contract` | How far you may deviate and stay conformant |
| `components` | Present only when the pattern needs a control your UI library lacks — see below |

### 3a. If the pattern names components, fetch them

Most patterns need nothing here: your component library already has the button,
the input, the dialog. But a few need a control it genuinely does not offer,
and `get_pattern` returns those with the pattern rather than making you know to
ask.

```
get_component({ slug: "token-bound-field" })
```

You get the source to paste, `source_path` telling you where it lands,
`reference` — a study of the base components it extends — and `extension`,
which is the one to read before you edit anything. It records what the
component deliberately does **not** do. Those omissions are usually the
accessibility behaviour, and they look exactly like gaps worth filling in.

**Do not build your own version of a listed component.** It exists precisely
because the obvious implementation gets something wrong: `token-bound-field`
is there because every reference design signals a token binding with colour
alone, and a screen reader user then cannot tell a shared value from a local
one. You would reproduce that, reasonably, by copying what the design shows.

Annotate a pasted component the same way you annotate a pattern:

```
// @genui component:token-bound-field@1
```

### 4. Compose with related patterns

```
get_related_patterns({ id: "…" })
```

`commonly_paired_with` is the composition signal — patterns that genuinely work
together. `alternative_to` is the opposite: those are *competing* answers, so
never compose two alternatives as though they stacked.

### 5. Record which pattern and which revision you built from

Put one line next to what you built:

```js
// @genui faceted-list@4
export function ProductTable() { … }
```

Both values come back from `search_patterns` and `get_pattern` — the `revision`
field and the `slug`. You already have them; there is no extra call to make.
Use the library-qualified form (`// @genui inarch/faceted-list@4`) only when
two libraries in the same codebase carry the same slug.

**Why bother.** Patterns move. When `interaction_contract` changes, every
screen built against the old one is quietly wrong, and nothing in the codebase
says which screens those are. The annotation is what makes the answer
retrievable later:

```
check_pattern_revisions({ annotations: [
  { slug: "faceted-list", revision: 4, location: "src/ProductTable.tsx:12" },
  …every annotation from the scan, in ONE call
]})
```

It answers in four buckets. `stale` names the fields that changed, so a
`description` fix reads differently from an `interaction_contract` change.
`ahead` means the code cites a higher revision than this library has — a fork
or a different instance, not staleness. `unknown` is normal: a repo drawing on
two libraries will cite slugs this connection cannot resolve.

One line per pattern. A component built from three patterns carries three
lines.

### 6. Record every deviation, right there

A departure that is not written down cannot survive a pattern update — nobody
can tell later whether it was a decision or an accident.

```js
// @genui faceted-list@4
// @genui-custom filterPlacement=inline-start
//   Six facets; the contract permits either placement. Re-check on update.
// @genui-deviation no-url-persistence
//   The contract requires filters in the URL. This view lives in a modal with
//   no route of its own. Revisit if it ever gets one.
```

`@genui-custom` is a choice the `customization_contract` **allows**;
`@genui-deviation` is something it does **not**. Both need a following line
saying WHY — on update, the reason is the only thing that decides whether the
choice still applies, and it is the one thing nobody can reconstruct later.

Full detail, including how to propose a change, is in `get_guidelines()`.

## Keeping the library from swelling — `find_redundancy`

Every route except `reuse_as_is` makes the corpus bigger. Without a
counter-force it only ever grows, and a library too large to be coherent gives
agents contradictory answers to the same question — worse than having no
library. This is the check that pushes back:

```
find_redundancy({ threshold: 0.45 })   // threshold optional
```

It compares **only patterns at the same containment level**, and **only those
with no recorded relation between them**. Both filters are necessary, and both
were established by measurement rather than assumed:

- A header bar and the shell containing it are not alternatives. Cross-level
  similarity in this corpus peaks at **0.566** — and that top pair is
  `admin-shell contains app-header`, where redundancy is impossible by
  construction. Without the level filter, the loudest alarm is always the whole
  and the part it was built from.
- Level separation alone is not enough: `property-inspector contains
  empty-state` is a *same-level* composition. Only the recorded relation knows.

Every result is a **question for a curator, never a finding**. The remedies run
cheapest first: record the missing relation, `supersedes` and deprecate the
older, or `variant_of` to subordinate the narrower case. **Never delete** — code
in other repositories cites the slug, and a slug that stops resolving makes
those annotations unanswerable.

At the corpus's current size this correctly reports nothing. A heuristic that
found something here would be measuring noise.

## Rules that matter

**Implement every state in `content_slots`.** Empty, loading, error, partial,
success. A screen that only handles the success path is incomplete — this is
the single most common way generated UI falls short of the house standard.

**Implement the whole `interaction_contract`.** A pattern without its keyboard
path is not the pattern. Accessibility here is a property of the pattern, not a
later remediation.

**`translation_status: "missing"` is a normal answer.** It means no pre-rendered
code exists for your target yet. The pattern is still a specification — build
from `interaction_contract`, `content_slots`, and `forces`. Do not treat it as
an error or as a reason to skip the library.

**Nothing found is information — but only if you record it.** If a search
returns nothing, or returns the wrong thing, say so:

```
report_retrieval_miss({
  query: "…exactly what you searched for…",
  expected_slug: "faceted-list",     // omit if the library really has none
  phrasing: "code",                  // or "intent" — they score differently
  note: "got expandable-row-table, which cannot filter"
})
```

You are the only one who can report this: you asked, you read the answer, and
you know whether it fitted. Nobody else ever finds out.

It changes nothing immediately — it records a permanent calibration case, so the
fix can be proven and a later regression caught. This is not a formality: it
already surfaced a real defect. `sidebar-nav-2level` could not be retrieved by a
query that is nearly its own `intent` verbatim, because its prose never says
"sidebar" while "application" — the word belonging to the shell that contains it
— ran through every field.

Pass `expected_slug` when you later found the pattern yourself. Leave it out to
record that the library appears to have none; that is a different and equally
useful finding, and a confident wrong answer is as much a defect as a miss.

Also tell the user in your reply. The library growing is not a substitute for
the person in front of you knowing the house had no answer.

**Do not paste the pattern's prose into the UI.** `content_slots` describes
what each state should accomplish; the actual wording is yours to write for the
product in front of you.
