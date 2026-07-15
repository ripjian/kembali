# The Build-Complete Mindset (transferable template)

> Project-agnostic. Drop this file into any repo as `DEVSPEC.md` (or link it from `CLAUDE.md`) and adapt the bracketed parts. Origin: the Kembali loyalty platform's development discipline. Written for AI coding agents of any capability level and the humans directing them.

## 1. The core idea

A feature is not "the happy path works." A feature is a set of loops, and every loop must close. Half-open features rot: uneditable records, undeletable rows referenced by history, balances nobody can explain, settings that do nothing, actions nobody can undo. The agent's job is to close every loop BEFORE calling anything done, and to write down what it couldn't decide.

## 2. The Closure Rule (apply to every feature, big or small)

| Loop | Test question |
|---|---|
| Create ↔ Edit ↔ Retire | Can it be made? Changed? Retired? (Deactivate/archive when history references it; hard delete only when nothing does) |
| Action ↔ Undo | Can a human fumble this? Then there's an undo path. On append-only data, undo = a compensating event, never mutation |
| Balance ↔ Ledger | Is any displayed total a projection of an immutable event log, reconcilable in a test (total = Σ events)? |
| Config ↔ Effect ↔ Report | Does every setting visibly change behavior? Does every flow that moves value have a report? |
| Grant ↔ Audit ↔ Visibility | Is every privileged action logged with actor + reason? Can the affected user see what happened to their stuff? |
| Feature ↔ Permission ↔ Gate | Does the new capability have a role/permission entry, a feature toggle where relevant, and a pricing/plan mapping if the product sells tiers? |
| Data in ↔ Data out | Is everything stored about a person exportable? What happens to it on account deletion? (Usually: anonymize, keep events) |
| UI states | Empty (invitation, not apology), loading, error (what failed → why → what to do), plus responsive + theme + accessibility checks |
| Offline / retry / concurrency | What happens on a dead connection, a double-click, two simultaneous submits? Idempotency keys are cheap insurance; add them early |
| Edge inputs | Zero, negative, enormous, duplicate, expired, revoked. Decide each explicitly; reject loudly, never silently clamp |

If a row doesn't apply, say so in the report. Never skip silently.

## 3. The document set (four files, strict roles)

1. **CLAUDE.md** — the SOP: reading order, coding rules, verification gates, git discipline, communication style. Written so the smallest model can follow it literally.
2. **ROADMAP.md** — what and when: phases with exit criteria, data model, a Decision Log (append-only: date, decision, rationale; supersede with new rows, never rewrite history).
3. **DEVSPEC.md** — how complete: the Closure Rule plus per-module invariants, edge cases, and **ASK OWNER** markers (open decisions listed with 2–3 options and a recommendation; the agent asks, never invents policy; answered markers become dated decisions).
4. **MODULES.md** — the inventory: every module, route, audience, permissions, gating, phase, status. Skim before adding anything so you know what exists.

Rule: every session ends by updating whichever of these its work touched. Docs that lag the code are worse than no docs.

## 4. Session protocol (for any agent, any model)

1. Read CLAUDE.md → ROADMAP (current phase + Decision Log) → DEVSPEC → MODULES → the files you'll touch. In order.
2. Restate the task in one sentence. Check it against the current phase (never build later phases early) and against the Closure Rule.
3. Unknowns: Decision Log first, then DEVSPEC markers, then the code, then the knowledge vault (§5). Still unsure → ask the owner with concrete options. Never invent policy.
4. Verify everything, every time (typecheck, lint, tests, build, responsive, themes, console, security gates). Never weaken a test to pass it. Never report done with a failing gate.
5. Close the docs loop (§3) and commit per logical task with conventional messages.

## 5. The knowledge layer: claude-obsidian vault

The docs above capture THIS project's rules. The vault captures everything else: research, decisions-in-context, session learnings, cross-project patterns. Powered by the `claude-obsidian` plugin (github.com/AgriciDaniel/claude-obsidian): an Obsidian vault Claude maintains as interlinked Markdown with a session-persistent hot cache.

**Install (once per machine, inside Claude Code):**
```
claude plugin marketplace add AgriciDaniel/claude-obsidian
claude plugin install claude-obsidian@agricidaniel-claude-obsidian
```
Create/clone the vault folder, open Claude Code there once, run `/wiki` to scaffold (pick a methodology mode; Generic is fine). Optional Obsidian app on top.

**Wire it into each project's CLAUDE.md:**
```
## Wiki knowledge base
Path: [~/path/to/vault]
When you need context not already in this project:
1. Read wiki/hot.md first (recent context cache)
2. If not enough, read wiki/index.md
3. Then drill into the relevant wiki pages only
Do NOT read the wiki for general coding questions or tasks unrelated to [domain].
```

**Working habits:**
- After a session that produced research, a market decision, or a hard-won lesson: `/save [name]` files the conversation into the vault.
- Drop external sources (specs, competitor pages, provider docs) into `.raw/` and say `ingest [file]` — Claude cross-references them into pages.
- `what do you know about [X]?` answers from the vault with citations before you re-research anything.
- Periodically: `lint the wiki` (orphans, dead links, contradictions) and `update hot cache`.
- Division of truth: **repo docs bind behavior; the vault remembers context.** A decision lives in the Decision Log; the story of WHY, with sources, lives in the vault and links back.

## 6. Anti-patterns this mindset exists to kill

- "MVP brain": shipping create without edit/delete, action without undo, money without a ledger, settings without effects.
- Silent invention: the agent guessing policy (expiry rules, deletion semantics, pricing gates) instead of asking.
- Doc drift: code that moved on while the roadmap still describes last month.
- Test weakening: editing an assertion to green instead of fixing behavior.
- Phase-jumping: building the fun later thing before the boring current thing has closed its loops.
- Memory loss: re-researching or re-deciding things a previous session already settled, because nothing was written down or vaulted.
