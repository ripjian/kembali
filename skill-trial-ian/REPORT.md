# Trial report: ian-xiaohei-illustrations skill

Date: 2026-10-03. Scope: install the skill from `https://github.com/helloianneo/ian-xiaohei-illustrations.git` into this project only, run it once on a Kembali example, and explain how it works.

## 1. Summary

- Installed: one skill, `ian-xiaohei-illustrations`, project-local, laid out exactly like `brag` (canonical copy under `.agents/skills/`, symlink under `.claude/skills/`, entry in `skills-lock.json`). Nothing was written outside the project except the npx cache and the scratchpad clone.
- What it is: a prompt-only skill (no code) that teaches an agent to turn a Chinese article into a short list of 16:9 "article illustrations" in one fixed hand-drawn style, starring a recurring black blob character called 小黑 (Xiaohei, "little black"), and then to generate each one with an image model.
- Run result: the planning half ran fully (source text digested, three-shot list, one complete generation prompt). The generation half stopped at the first API call because no image provider key exists on this machine. The exact stopping point and the full prompt are in `run-log.txt`.
- Fit for Kembali: the planning method and the style rules are useful as is. The character, the Chinese handwriting and the red, orange, blue annotation palette all conflict with BRAND.md, so a Kembali adaptation is needed before anything from it ships. Concrete ideas are in section 9.

## 2. What the skill is for

The repo README (Chinese) describes it in one line, translated: "turn the judgements, flows, states and metaphors inside a Chinese article into white-background, hand-drawn, absurd but clean in-body illustrations". It was written for OpenAI Codex (the `agents/openai.yaml` file and the `image_gen` tool it refers to are Codex concepts), but it is plain Markdown so Claude Code loads it the same way.

The author positions it against three things it is not: commercial illustration, PPT infographics, and cute mascot or children's cartoon art. The central rule is that each picture explains exactly one idea from the text, and the character must be doing the work that explains it, never standing beside a diagram.

Default outputs the README promises: a shot list of 4 to 8 images per article, then one PNG per shot saved under `assets/<article-slug>-illustrations/` in the user's workspace. It explicitly does not produce PPTX, PDF, SVG, HTML, editable vectors, posters or cover art.

## 3. Install layout created

The source repo exposes exactly one skill. `npx skills add <url> --list` printed:

```
Found 1 skill
  ian-xiaohei-illustrations
```

Install command used (project scope is the default; `-g` would have made it global):

```
cd /Users/markous/Documents/Projects/mobileLoyalty
npx skills add https://github.com/helloianneo/ian-xiaohei-illustrations.git \
  --skill ian-xiaohei-illustrations -a claude-code -y
```

The CLI (skills 1.7.0) detected Claude Code and installed non-interactively. One difference from the `brag` layout: for this run the CLI chose "copy" mode and put the folder directly at `.claude/skills/ian-xiaohei-illustrations`, without the `.agents/skills/` canonical copy. To mirror `brag` exactly I moved the folder and replaced it with a relative symlink:

```
mv .claude/skills/ian-xiaohei-illustrations .agents/skills/ian-xiaohei-illustrations
ln -s ../../.agents/skills/ian-xiaohei-illustrations .claude/skills/ian-xiaohei-illustrations
```

Resulting layout, side by side with `brag`:

```
.agents/skills/brag/                          (canonical copy, 7 entries)
.agents/skills/ian-xiaohei-illustrations/     (canonical copy, 13 MB, 20 files)
.claude/skills/brag -> ../../.agents/skills/brag
.claude/skills/ian-xiaohei-illustrations -> ../../.agents/skills/ian-xiaohei-illustrations
```

`skills-lock.json` gained this entry (written by the CLI, not by hand):

```json
"ian-xiaohei-illustrations": {
  "source": "helloianneo/ian-xiaohei-illustrations",
  "sourceType": "github",
  "skillPath": "ian-xiaohei-illustrations/SKILL.md",
  "computedHash": "0345947cf4ffbbaa3190d7d676e0a35821daae349be036555050a51eb71f5b55"
}
```

`computedHash` is the CLI's own content hash of the installed folder (it is not the SHA-256 of `SKILL.md`; I checked). It is what `npx skills update` compares against.

Verification:

- `.claude/skills/ian-xiaohei-illustrations/SKILL.md` exists through the symlink.
- `diff -r` between the installed folder and the fresh clone under the scratchpad reports no differences.
- Claude Code picked the skill up immediately (it appeared in the available skills list with its Chinese description).

Git view after the work (nothing committed, per instructions):

```
 M skills-lock.json          (note: the brag entry was already an uncommitted change before this task)
?? .agents/
?? .claude/skills/brag
?? .claude/skills/ian-xiaohei-illustrations
?? skill-trial-ian/
```

One side effect worth knowing: to attempt generation I ran `pnpm install --ignore-workspace` inside `.claude/skills/image-generation/scripts/`, which created a 63 MB `node_modules` there. That path is covered by that skill's own `.gitignore`, so git does not see it. Delete it if you want the disk back.

## 4. File by file walkthrough

Installed files, all under `.agents/skills/ian-xiaohei-illustrations/`. The repo root also carries `README.md`, `LICENSE`, `NOTICE.md`, `examples/prompts.md`, eight example PNGs and the author's WeChat QR code; the CLI correctly left those out because they are GitHub documentation, not part of the skill.

### SKILL.md (the entry point, about 90 lines, Chinese)

Front matter:

```yaml
name: ian-xiaohei-illustrations
description: 生成 Ian 风格的中文正文配图。用于用户要求为中文文章、帖子、博客、Notion 文档、
  工作流文档、方法论、流程、结构、状态、隐喻或观点生成"怪诞""小黑""手绘""正文配图"
  "文章插图""配图建议""shot list""去标题/改图"等任务 ...
```

Translated: "Generate Ian-style in-body illustrations for Chinese articles. Use when the user asks for 'absurd', 'Xiaohei', 'hand-drawn', 'article illustration', 'illustration suggestions', 'shot list', 'remove title / edit image' tasks for Chinese articles, posts, blogs, Notion docs, workflow docs, methodologies, flows, structures, states, metaphors or opinions."

The body has five parts:

1. Core positioning. Key sentence, translated: "The goal is not commercial illustration, PPT infographics or cute cartoons, but to turn a key judgement, flow, structure, state or metaphor from the article into one clean, absurd, creative, readable but not instruction-manual hand-drawn explanatory picture." And: "小黑 must take part in the core action of the picture; it cannot just stand at the side as decoration."
2. Reading order for the references, with an explicit instruction to load them on demand rather than all at once, and a warning that `assets/examples/` is "for low-frequency visual calibration only, not on the default generation path. Do not copy their composition, objects or labels."
3. The workflow (section 5 of this report walks through it).
4. QA and iteration triggers.
5. Delivery format: images go to `assets/<article-slug>-illustrations/01-topic-name.png` and so on, "keep the original generated files, never overwrite existing assets unless the user explicitly asks".

The closing instruction on tone: "Strategy output before generation should be short and precise. Delivery after generation must say how many were generated, what each is for, the save path, and which are the safest and which are optional. Do not explain style theory at length; let the pictures speak."

### agents/openai.yaml (6 lines)

Codex-specific metadata: a display name ("Ian 小黑配图"), a one-line description, a default prompt, and `allow_implicit_invocation: true`, which tells Codex it may trigger the skill without the user naming it. Claude Code ignores this file.

### references/style-dna.md

The visual rulebook. See section 6 for the full content. The one-line summary, translated: "pure white, minimal, hand-drawn, white space, restraint, absurd, product-sketch feel, Chinese handwriting feel, structure clear but not an instruction manual. Like a sketch someone who has spent years on AI, product, design and dev tools would draw on white paper to explain something."

### references/xiaohei-ip.md

The character sheet. Defines look ("solid black little monster, white dot eyes, thin legs, sometimes thin arms, body can be a cylinder, bean, box, funnel, shadow, hole, or a black block inside a machine, slightly irregular outline, blank, dazed, calm, serious expression"), personality ("very serious but doing something slightly absurd, like a low-key system operator, dry humour, not cutesy, a bit clumsy but not stupid"), a list of typical jobs (carrying material, pulling threads together, being stuck in a breakpoint, pulling a 'judgement' lever inside a machine, becoming a funnel, cutting a 'material fish', stamping, holding a warning sign, reaching out of a hole and failing to catch content), and bans (no cute mascot, no children's cartoon, no costumes or sparkly eyes, never standing in a corner watching, never upstaging the structure).

The test it gives, translated: "If you remove 小黑 and the picture's core metaphor still fully holds, 小黑 is too decorative; rewrite the prompt so 小黑 is the subject of the action."

### references/composition-patterns.md

Three things:

1. Eight structure types to choose one of: Workflow (input, process, output, orange arrows), System fragment (3 to 5 modules, character in one key action), Before and after (chaos left, order right, orange arrow between), Character states (2 to 4 small states with one label each), Concept metaphor (one big odd machine or object with few inputs and one output), Method layers (stacked boxes, never a formal pyramid, character carrying bricks), Map route (one curved path, few nodes), Mini comic (2 to 4 panels, one action each).
2. A three-step method for inventing a metaphor: replace the abstract concept with a physical action (stuck, leaking, getting heavier, sorting, settling, fermenting, opening a door, folding, unpacking, flowing back); replace the system with a low-tech object (broken machine, cardboard box, drawer, pipe, letterbox, odd dial, scale, well, ladder, odd workstation); make 小黑 do the action. Pools of objects and verbs follow, with "pick 1 or 2, do not pile up".
3. An anti-copy rule listing nine existing compositions that must not be reused unless the user asks (conveyor with two breakpoints, 小黑 pulling a judgement lever inside a content machine, 小黑 as a funnel sorting traffic/trust/conversion, 小黑 cutting the material fish, 小黑 leading a handoff path, 小黑 pulling three information sources, three 小黑 with megaphone/bridge/door, 小黑 stamping a toolbox of phrases, 小黑 holding a sign over a path of common pitfalls). It even suggests alternatives: "handoff path does not have to be a route; draw 小黑 attaching the tail of a piece of content to a door handle".

### references/prompt-template.md

The one generation prompt, in English with Chinese slots. It is reproduced in full in `prompt-01-skill-native.txt` with the slots filled. Structure: fixed "Visual DNA" paragraph, fixed character paragraph, then Theme, Structure type, Core idea, Composition, Suggested elements, Chinese handwritten labels, Colour use, Constraints. Two edit prompts follow: one to remove a stray top-left title ("Edit the provided image. Remove only the handwritten title ... Fill that area with the same clean white background ... Do not add any new text or objects.") and one to push the character into the action ("Regenerate this illustration with the same core meaning and simple layout, but make 小黑 more central to the conceptual action ...").

### references/qa-checklist.md

Twelve must-pass checks (16:9, clean white, 小黑 present and doing the core action, no copied composition, absurd and interesting, subject under 60 percent of canvas, one structure only, few short readable labels, orange only on paths, red only on key points, blue only on secondary notes), ten failure signals (top-left title, mascot look, PPT look, too many arrows or nodes, paragraphs of text, paper texture or shadow or beige, real UI, bad Chinese characters, no absurd metaphor, too close to an example), and a fix table (too ordinary: make 小黑 the actor; too complex: cut to one action and 3 to 5 labels; too cute: add "deadpan, blank serious expression, not cute, not mascot"; too PPT: remove title, borders, grid, extra arrows; too close to an example: keep meaning, swap object and action; wrong text: local edit first, regenerate with fewer labels if it is bad).

Its acceptance line, translated: "A good picture should make the reader think 'that is a bit odd' first and then understand the structure within one second. If the first impression is a tutorial page rather than an absurd product sketch on white paper, it fails."

### assets/examples/ (14 PNG files, 1672 x 941, about 13 MB)

Reference renders by the author, all in the target style. I viewed three. They look like fine black pen drawings on pure white: wobbly line, no fill except the character's solid body, two to five handwritten Chinese labels in red, orange and blue, a single orange arrow for the main flow, and about half the canvas empty. In every one the character is mid-task (holding a tipped-over box of material, laying evidence cards across a canyon, pulling a lever inside a machine). Several of them do carry a red top-left title, which the newer checklist now treats as a failure signal, so the examples are slightly behind the rules.

### Files not installed (repo root)

- `README.md`: install instructions for Codex (`cp -R ./ian-xiaohei-illustrations ~/.codex/skills/`), usage prompts, the workflow summary, and author links.
- `examples/prompts.md`: eight ready-to-paste prompts: plan only, illustrate an article, long-form strategy, single opinion, workflow theme, remove title, strengthen 小黑, and a five-theme style sampler.
- `LICENSE`: MIT, copyright 2026 Ian.
- `NOTICE.md`: states the example images were generated by the author, that 小黑 is "part of Ian's visual language", and asks that redistributions or adaptations keep the name "Ian Xiaohei Illustrations" or credit Ian.
- `assets/ian-wechat-qr.jpg`: the author's WeChat contact code.

No scripts, no package.json, no requirements file, no templates folder. The skill is 100 percent instructions and sample images.

## 5. The end-to-end workflow it drives

Step 1, digest the text. Read whatever the user gives (article, Markdown, Notion page, screenshot). Extract: the core claim, which paragraphs carry a cognitive turn, which parts suit a picture, which parts should stay text. Decision point: "do not illustrate evenly". Prefer "cognitive anchors": the core judgement, two breakpoints, an input-output loop, a split, before and after, one source many uses, a handoff path, common pitfalls, a character's state change.

Step 2, shot list. Decision point: did the user ask only to plan ("analyse where to illustrate")? Then stop after this step. For each shot write: placement (after which paragraph), theme, core meaning, structure type, what 小黑 is doing, suggested elements, suggested Chinese labels. Count: 4 to 8 by default, 1 to 3 for a short piece, never casually over 9.

Step 3, generate one image per shot. Decision point: did the user say "generate / output / make / help me generate"? Then do not pause for confirmation; call the built-in `image_gen` tool once per shot, never collage several into one. Each prompt must contain: 16:9 horizontal Chinese article illustration, pure white background, black hand-drawn line art, few red/orange/blue handwritten Chinese labels, lots of white space, 小黑 as the actor, and the ban list (PPT, commercial illustration, childish cute, complex architecture, top-left title). Decision point: is this one of the nine known compositions? Then invent a new metaphor unless the user asked for a copy.

Step 4, check and iterate against `qa-checklist.md`. Decision point per failure signal: local edit (for a stray title or a wrong label) versus full regeneration (for decoration-only 小黑, a crowded canvas, a PPT look, too much or garbled Chinese, cute style, non-white background).

Step 5, deliver. Copy finals to `assets/<article-slug>-illustrations/NN-topic-name.png`, keep originals, never overwrite. Report count, purpose per image, paths, and which images are solid versus optional.

## 6. The style system it encodes

Canvas and line:

- 16:9 landscape only.
- Pure white background. Explicitly banned: beige, warm grey, paper texture, gradients, shadows, noise, vintage paper.
- Black hand-drawn line art: thin, slightly wobbly, "not mechanical, not vector, not heavy outline".
- White space: subject occupies about 40 to 60 percent of the canvas, at least 35 percent must be empty, ideally one whole quiet area.

Text:

- Handwritten Chinese labels only, at most 5 to 8 per image, each 2 to 8 characters.
- No title in the top-left corner, no structure-type name on the image ("Workflow", "system architecture", "common pitfalls", "roadmap" are all banned as on-image text).
- Shorter labels are more stable with image models; if characters come out wrong, cut labels and regenerate.

Colour (four colours total, with fixed semantics):

- Black: main line art, the character, frames, structures, main text, main objects.
- Red: key annotations, problems, emotional points, key reminders, results.
- Orange: main flow, path, arrows, automation direction, movement from A to B.
- Blue: supplementary notes, mental state, system state, second-layer explanation, AI or assistant hints. "Blue is not required in every image. Be restrained; fewer is better."

Composition: one structure type per image, chosen from the eight in `composition-patterns.md`; one or two low-tech objects; one physical verb; the character performs it.

Character: as in `xiaohei-ip.md`, a solid black blob with white dot eyes, thin legs, blank serious face, slightly irregular outline, allowed to morph into a funnel, box, hole or machine part, always doing the job that carries the metaphor.

Aesthetic target, translated: "absurd, creative, interesting, clean and simple, free-wheeling. Not cute, not childish, not complex, not stiff."

Bans (full list from `style-dna.md`): commercial illustration, PPT infographic, formal flowchart, course slides, cute cartoon poster, children's illustration, complex architecture diagram, polished flat illustration, techy UI, real app screenshots, complex backgrounds, explaining every node, type titles in the top-left.

## 7. External dependencies

The skill itself depends on nothing you can install. It depends on one thing at runtime: an image generation tool reachable from the agent.

| Dependency | What the skill expects | On this machine |
|---|---|---|
| Image model | A built-in `image_gen` tool (Codex's name for its OpenAI image model). The prompt template is model-agnostic text, so any text-to-image model that can render Chinese handwriting is usable. | Claude Code has no built-in image tool. The project's `image-generation` skill wraps Google Gemini (`gemini-3.1-flash-image-preview`) and fal.ai FLUX.2 klein 4B. |
| Image editing | Edit prompts for removing titles and strengthening the character assume an image-to-image edit endpoint. | The same script supports `--assets` for edit mode on both providers. |
| API keys | None named by the skill. | `GEMINI_API_KEY`, `FAL_KEY`, `XAI_API_KEY`, `OPENAI_API_KEY` all absent from the environment; `.claude/skills/image-generation/scripts/.env` does not exist. |
| Node packages | None for the skill. The project's generator needs `@google/genai`, `@fal-ai/client`, `mime`, `dotenv` (installed during this trial, gitignored). | Node v26.0.0, pnpm 11.10.0, `tsx` via npx. |
| Python | None. | Python 3.9.6 present, unused. |
| Codex CLI | Only for the `openai.yaml` metadata. | Not installed, not needed. |

Cost notes, from the project's own `image-generation` SKILL.md rather than from me: fal.ai klein 4B is listed at about USD 0.003 per image and is suggested for drafts; Gemini is listed as "higher" cost and recommended for final assets and text-heavy images. A full article at 6 shots with two or three regenerations each would be roughly 15 to 20 image calls. For exact Gemini image pricing check Google's current price list before relying on a number.

The `skills` CLI itself sends an install telemetry event (its `--metadata` flag attaches JSON to it) and queries skills.sh for the "Security Risk Assessments" panel that printed during install (Gen: Safe, Socket: 0 alerts, Snyk: Low Risk).

## 8. What happened when I ran it

Input: `source-article.md`, three short sections lifted from the live `/story` page (the washed card problem, the append-only ledger, deduct-at-confirm). I ran the skill as a user would with the "generate" wording, so it should not stop for confirmation.

Step 1 and 2 output: `shot-list.md`. Three shots (the skill's own guidance for a short text), each with placement, theme, core idea, structure type, the character's action, elements and labels. Metaphors invented fresh: a laundrette drum for the washed card (before and after), a ticket clerk stamping a tape into a sealed box for the ledger (concept metaphor), a balance scale with a confirm lever where a screenshot weighs nothing for deduct-at-confirm (system fragment). None reuse the nine banned compositions.

Step 3 output: `prompt-01-skill-native.txt`, the template filled for shot 01 with Chinese labels 洗没了 / 还在 / 丢不了 ("washed out / still here / cannot be lost"). I also wrote `prompt-01-kembali-english.txt`, the same prompt adapted to English labels and the Pandan palette, for section 9.

Generation attempt: the only image backend available is the project's `image-generation` script. Both providers were tried with the native prompt, 16:9, destination `skill-trial-ian/01-card-through-the-wash.png`. Each printed its provider banner and the full prompt, then stopped before any network call:

```
Provider: Google Gemini
Aspect ratio: 16:9
...
Error: GEMINI_API_KEY not found in environment variables
exit code: 1

Provider: fal.ai FLUX.2 klein 4B
...
Error: FAL_KEY not found in environment variables
exit code: 1
```

Full transcript: `run-log.txt`. No image was produced, no temp files were left in the scripts folder, and no key was invented.

What is needed to complete the run: one key in `.claude/skills/image-generation/scripts/.env` (either `GEMINI_API_KEY=` or `FAL_KEY=`), then the exact command from the log. Expected output: one 16:9 PNG at the destination path. Steps 4 and 5 would then be: view the PNG, check the twelve QA items, regenerate or edit (the edit prompt with `--assets <png>`), and copy the keeper to `assets/<slug>-illustrations/01-card-through-the-wash.png`.

## 9. How it could be used for Kembali

The useful part is the method, not the mascot. Three things transfer directly:

1. The shot-list discipline (one cognitive anchor per image, placement after a specific paragraph, 1 to 3 images for a short page) fits the marketing site, which already has editorial pages (`/story`, `/roadmap`, `/security`) that explain one idea per section.
2. The "physical verb plus low-tech object plus an actor" recipe is a fast way to get non-generic metaphors for product concepts: append-only ledger, deduct-at-confirm, single-use coupon, outlet picked once per day, OTP as the account.
3. The QA list (no title on the image, under 60 percent subject, 35 percent empty, few short labels, no PPT look) is a good acceptance test for any explanatory graphic, AI-generated or not.

Concrete, small ideas:

- `/story` chapter openers. Three line drawings matching `shot-list.md` would sit naturally above "Chapter zero", "the ritual" and "the reward". The page already uses a sand canvas and Fraunces display type; a thin black line drawing with one coral accent would read as part of the editorial system.
- `/security` and `/privacy` explainers. "A ledger nothing can quietly edit" and "deduct at confirm, screenshot buys nothing" are exactly the kind of abstract guarantees that a single absurd object explains faster than a paragraph.
- Pricing page module cards. One tiny drawing per module (stamps, points, rewards, referrals, QR kit) in the same hand.
- Merchant onboarding guide. The owner checklist and cashier walkthrough shipped 2026-09-21 are text-only; one drawing per step would make them friendlier without adding copy.
- Social and reels. The style is cheap to produce in volume and distinctive next to stock photography, which suits the `social/` and `kembali-reels/` work.

Adaptation needed before any of that (see `prompt-01-kembali-english.txt` for the worked version):

- Labels in English, sentence case, 2 to 4 words, per BRAND.md section 5 and SOP 3. The skill's whole text rule is written for Chinese handwriting; English handwriting in image models is generally more reliable, so this is a gain, not a loss.
- Palette. The skill's red, orange, blue carry fixed meanings (problem, flow, system note). Kembali's tokens also carry fixed meanings (pandan = act, coral = earn, leaf = progress). A direct mapping that keeps both systems honest: black line art stays `#16261E` (text ink), arrows and "action" labels become pandan `#0F3D32`, earned things (filled stamps, a reward, a warning about losing them) become coral `#E0684B`, and blue drops out. Leaf `#7FB069` could stand in for the skill's blue "system state" role if a third colour is needed. That is a brand decision for you, not something I would ship unasked.
- Background. The skill demands pure white. Kembali's canvas is sand `#F6F1E3`. Either generate on white and place the PNG on a white card, or request a transparent background from the model and let the page supply sand. Do not ask the model for a beige background; the style rules and the examples both treat that as a failure.
- The character. 小黑 is the author's identity (NOTICE.md). For Kembali, either keep a nameless black blob as a generic "worker" (the prompt in `prompt-01-kembali-english.txt` does this), or replace it with something Kembali already owns, for example a stamp-dot character derived from the coral final "i" of the wordmark. The second option avoids any identity overlap and is the one I would recommend if this becomes a recurring house style.

## 10. Risks and caveats

- Licence and identity. Code and text are MIT. The NOTICE asks for attribution of "Ian Xiaohei Illustrations" or Ian in derived documentation, and calls 小黑 part of Ian's visual language. Using the recipe is fine; using 小黑 as a recognisable Kembali character would borrow another creator's identity and should be avoided for brand work.
- Example images. They were generated by the author with an unspecified image model and are bundled as calibration only. Do not reuse them on the site; their provenance and model terms are unknown.
- Model terms and copyright. Any images you generate are subject to the provider's terms (Google, fal.ai or OpenAI) and to the unsettled status of AI-generated art under copyright. Fine for marketing illustration, worth noting if a drawing ever becomes a trademark-like asset.
- Cost and iteration. The skill expects several regenerations per shot. Budget 2 to 4 calls per final image. Keep `--cheap` for exploration and the default provider for the keeper.
- Text reliability. The skill repeatedly warns that image models garble Chinese; English labels will help but still need a visual check every time. The checklist's "local edit first" advice means an edit-capable endpoint is needed, which the project script supports via `--assets`.
- Brand conflicts if used literally. Chinese labels, the red/orange/blue palette, pure white canvas and a third-party mascot all contradict BRAND.md. Treat the skill as a method, and route the colour and character choice through a Decision Log row before shipping anything.
- Prompt injection surface. The skill is plain Markdown that instructs the agent, with no code. I read all of it; it contains nothing beyond illustration guidance. Future `npx skills update` runs will pull whatever the author pushes next, so re-read after updates.
- Writes outside the project. The skill writes only to `assets/<slug>-illustrations/` inside the workspace. The project's generation script writes temp files next to itself (`_tmp_*`) and removes them on success; on a hard crash they could remain in `.claude/skills/image-generation/scripts/`. None were left by this trial.
- Telemetry. The `skills` CLI reports installs to its backend and fetches a risk assessment from skills.sh. No project content is sent, only the package identity, as far as its output shows.
- Size. The install carries 13 MB of example PNGs into the repo working tree. `.agents/` and `.claude/skills/brag` are currently untracked, so decide whether to commit skill folders or ignore them before the next commit.

## 11. Files in this folder

```
skill-trial-ian/
  REPORT.md                       this report
  source-article.md               the text given to the skill
  shot-list.md                    skill step 2 output (3 shots, placement, metaphor, labels)
  prompt-01-skill-native.txt      skill step 3 prompt for shot 01, template filled, Chinese labels
  prompt-01-kembali-english.txt   the same prompt adapted to English labels and the Pandan palette
  run-log.txt                     both generation attempts and the exact failure point
```

No PNG exists because no image provider key is configured. Nothing was committed and no git configuration was touched.
