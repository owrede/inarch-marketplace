---
name: genui-import
description: "Import patterns into the Intelligence Architects pattern library from external collections — shadcn registries and blocks, published pattern libraries (Nielsen Norman, Material, HIG, Carbon, Polaris), an existing product codebase, Figma files, or any web page identified by URL and XPath. Use when asked to grow the library, harvest patterns from a source, or evaluate whether an external collection has anything the library lacks."
---

# Importing patterns into the library

This skill adds patterns to the corpus **from outside it**. The companion
skill (`genui-patterns`) is about consuming the library while building UI;
this one is about filling it.

Read that one first if you have not. Everything it says about what a pattern
IS — orchestration, not components; a contract, not a snippet — governs here
too, and an import that ignores it produces rows that retrieve badly and help
nobody.

## The one thing that makes this hard

**Sources carry code. The library wants contracts.**

A shadcn block gives you 300 lines of JSX and no statement of the keyboard
model. A Nielsen Norman article gives you the reasoning and no code. Neither
is a pattern in this library's sense, and the gap between them is where the
work actually is.

What the corpus ranks on, and what an import must therefore produce:

| Field | Where it comes from | Cannot be guessed |
|---|---|---|
| `intent` | What the USER accomplishes | — |
| `context` | When this applies | — |
| `forces` | Why it is shaped this way | ✱ prose sources have this; code does not |
| `interaction_contract` | Keyboard, roles, focus, announcements, direction, localisation | ✱ **read from the code or from the spec — never invented** |
| `content_slots` | Which states must be handled | ✱ |
| `anti_patterns` | When this is the WRONG answer | ✱ |

The starred fields are the ones an import gets wrong. A row with a good
`description` and an empty `interaction_contract` looks complete in a listing
and is useless at the point of use — the repo's own rule is that *a pattern
without its keyboard path is not the pattern*.

**Optimise for contract quality, not count.** Five imported patterns with real
contracts beat fifty with empty ones, and the fifty are worse than nothing:
they pollute retrieval, they trip `find_redundancy`, and every one of them has
to be re-derived later by someone who trusted it.

## Before importing anything: does the library already have it?

Every import makes the corpus bigger, and a library too large to be coherent
gives agents contradictory answers to the same question. Check first, per
candidate:

```
assess_fit({ need: "…the situation in prose…", containment: "view" })
```

| Route | What to do |
|---|---|
| `reuse_as_is` | **Do not import.** The library answers this already |
| `reuse_with_customization` | **Usually do not import.** Consider `propose_change` to widen the existing `customization_contract` instead — that is additive and nothing built on it stops conforming |
| `new_pattern` | Import candidate. Check `caution` — sometimes only a *control* is missing, and `add_component` is smaller and more reusable |
| `inspect_manually` | Read the candidate yourself before deciding |

Skipping this step is how a corpus accumulates near-duplicates that nobody can
tell apart six months later.

### The trap: `containment` silently hides the duplicate

`assess_fit` compares **only within one containment level** — deliberately, so
a header and the shell containing it are not read as alternatives. That is
correct behaviour and it will mislead you on import.

Measured while writing this skill, importing a shadcn login block:

```
assess_fit({ need: "let a returning user prove who they are…",
             containment: "view" })
→ route: "new_pattern", similarity: 0.176, "Nothing in the library is close."
```

The library holds `authentication-gate` — **stable**, and almost word-for-word
the same intent. It sits at `containment: application`, so passing `view`
excluded it from the comparison entirely. Following that recommendation would
have imported a duplicate of a reviewed pattern, at `proposed` maturity,
competing with it in retrieval.

**Therefore, on import:**

- **Run `assess_fit` without `containment` first**, then again with the level
  you think it is. A source rarely states which level a pattern lives at, and
  guessing wrong turns the duplicate check off without saying so.
- **Cross-check by name and intent** before writing: `search_patterns` with the
  intent phrased as purpose, or read the slug list directly. A `new_pattern`
  route at low similarity is a claim about one level, not about the corpus.
- **Treat `gap: true` with suspicion for anything conventional.** Login,
  confirmation, empty state, settings — the library almost certainly has these.
  A "genuine gap" for a pattern every product ships is nearly always a
  containment or phrasing artefact, not a finding.

## Per source: how to read it

### shadcn registries and blocks

Structured and machine-readable — the easiest source for code, the hardest for
contracts.

```bash
curl -s https://ui.shadcn.com/r/registry.json | jq '.items[] | {name, type, description}'
curl -s https://ui.shadcn.com/r/styles/new-york-v4/<name>.json | jq -r '.files[0].content'
```

Blocks live under `ui.shadcn.com/blocks` (`dashboard-01`, `sidebar-07`,
`login-04`, …). Third-party registries follow the same protocol; the
`registries` field in a project's `components.json` lists which are configured.

**Read the contract OUT OF the code, do not assume it.** Grep for `onKeyDown`,
`role=`, `aria-*`, `tabIndex`, `autoComplete`, and the Radix component names.
What you find is the contract. What you cannot find is not a contract you may
invent; it is a gap to record.

**Expect to find very little, and do not fill the silence.** Measured on
`login-04`, a shipped shadcn block, across both its files:

| Signal | Found |
|---|---|
| `aria-*` | none |
| `role=` | none |
| `onKeyDown` | none |
| `aria-live` | none |
| `autoComplete` | none |
| `htmlFor`, `required`, input types | present |

That is not a defective block. Blocks compose Radix primitives that carry the
APG behaviour internally, and native form semantics do the rest — so the
accessibility is largely real but **invisible at this layer**. The block itself
states almost nothing about focus, announcements, or the keyboard path.

The correct import from this is a contract that records label binding and
native validation as observed, and names keyboard, focus, announcements, RTL
and localisation as **not stated by the source**. An import that instead writes
a plausible-sounding keyboard model has fabricated the single most important
field, and it will be implemented as though someone checked it.

If you need the real behaviour, follow the `registryDependencies` down to the
primitives and read those — that is where it lives.

**A block is usually not one pattern.** `dashboard-01` is a shell plus a
sidebar plus a chart region plus a table. Import the *pieces* at their own
containment levels, or you create one row that answers no single situation and
retrieves for everything.

### Published pattern libraries (prose)

Nielsen Norman, UI Patterns, Material Design, Apple HIG, Carbon, Polaris.

These are the **best** source for exactly the fields code cannot give you:
`forces`, `anti_patterns`, `context`, and the reasoning behind the interaction
model. They are also the source where copying is a real risk.

**Write the pattern in your own words, from the understanding.** Do not
paraphrase sentence-by-sentence and do not lift prose verbatim into
`description` or `forces`. These are published, often copyrighted works. What
transfers legitimately is the *design knowledge* — that a destructive
confirmation needs the verb in the button rather than "OK" — not the wording.

Record where it came from in `description` as a brief attribution
("Convention documented in Material Design 3"), so a curator can trace the
lineage.

### An existing product codebase

The library already has a purpose-built loop for this, and it is better than
anything this skill would add:

```
scan_codebase({ pieces: [ {label, description, location}, … ] })
identify_pattern({ description: "what this code does, in your words" })
```

Use those, then import only what comes back as genuinely absent. **Do not use
`search_patterns` on existing code** — the measured scores in the
`genui-patterns` skill show code-phrased queries falling below the reuse
threshold for patterns the library already has, and in one case retrieving the
wrong pattern confidently.

The advantage here: the code is yours, so the interaction contract is
observable, and you can ask the people who wrote it why.

### Figma and design files

Via the Figma MCP (`get_design_context`, `get_variable_defs`,
`get_screenshot`).

Treat with care. A Figma file shows **structure and appearance**, and is
usually silent on keyboard, focus order, and announcements — the fields that
matter most. A design file alone is rarely enough for an `interaction_contract`;
pair it with the implementation or with the designer's own spec, and if neither
exists, record the gap rather than filling it with a plausible guess.

### Any web page, by URL and XPath

For collections with no API — a documentation site, an internal wiki, a
company design system.

```
/browse   (gstack skill — the house browser; do not use the Chrome MCP directly)
```

Give the XPath for the region holding the pattern list, extract entries, then
follow each to its own page for the detail. Expect this to be the messiest
source: pages mix pattern documentation with marketing and component API
reference, and only the first is importable.

The same copyright caution as prose libraries applies, more so for anything
behind a login or marked internal to another organisation.

## The import loop

Work in batches, and keep the batch small enough to review honestly — **ten
candidates is a lot**, not a warm-up.

**1. Harvest.** Read the source, list candidates with a one-line intent each.
No writes yet.

**2. Triage** with `assess_fit`, per candidate. Drop everything that comes back
`reuse_as_is` or `reuse_with_customization`.

**3. Derive the contract.** Per surviving candidate, fill the starred fields
from the source. Where the source is silent, write down that it is silent —
this becomes the review note, and it is the most useful thing in the whole
import.

**4. Write** via `propose_pattern`. One call per pattern:

```
propose_pattern({
  name: "…", intent: "…", context: "…", description: "…",
  interaction_contract: { keyboard, roles, focus, announcements,
                          direction, localisation },
  containment: "view_part",
  forces: [{ tradeoff, favors_this_when }],
  content_slots: {…}, anti_patterns: […],
  related_to: "…nearest existing slug…",
  relation_type: "alternative_to"
})
```

**Always pass `related_to`.** An imported pattern that resembles an existing
one with no recorded relation is precisely what `find_redundancy` flags later,
and the relation is what prevents that. On import the nearest neighbour is
already known — `assess_fit` just told you in step 2.

**5. Report.** This is not optional and it is the point of the batch.

## What the summary must contain

Everything created lands at **`proposed`** maturity: usable immediately, ranked
below reviewed patterns (weight 0.7 against `stable`'s 1.0), and **not checked
against the accessibility gate**. `propose_pattern` says so in its own response
for a reason.

So the batch summary carries, per pattern:

| Column | Why the curator needs it |
|---|---|
| slug + name | To find it |
| source | Where it came from, precisely enough to re-check |
| `assess_fit` route + score | The evidence it was a gap, not a duplicate |
| **contract completeness** | Which of the six contract fields are real vs. absent |
| **what the source did not say** | The honest gaps — a11y, RTL, localisation |
| nearest existing pattern | The relation you recorded |

And a plain statement at the top: *"N patterns imported at `proposed` maturity.
None has passed the accessibility gate. M have incomplete interaction
contracts, listed below."*

Then say it in your reply to the user too. A summary written into a file the
curator has not opened is not a review, and "imported 30 patterns" without the
gate caveat reads as an achievement when it is a queue of work.

## Rules

**Never import at `stable` or mark anything a standard.** Maturity is a
statement that a human reviewed it. An import has by definition not been
reviewed, and a skill that could set maturity would make the ladder meaningless.

**Never invent an interaction contract.** If the source does not state the
keyboard model and you cannot read it from code, the honest contract records
what IS known and names what is not. A fabricated contract is worse than a
missing one: it looks authoritative and it will be implemented.

**Do not import components as patterns.** A source's "Button" or "Combobox" is
not a pattern — your component library answers that. The `component` table
exists for controls the base library genuinely lacks, and its entry criterion
is that *several* patterns would reach for it.

**One pattern per situation.** If a candidate answers two situations, it is two
patterns or it is none. Splitting is cheap now and impossible later.

**Report what you skipped and why.** The candidates you dropped in triage are
information — they say the library already covers that ground, which is the
finding that keeps a corpus from swelling.
