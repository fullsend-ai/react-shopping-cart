# Delivery

How a change gets from a Jira story to `main`, and what happens after that.
GitHub ruleset rechecked on 2026-11-22; auto-merge behavior updated for issue #104.

**Merging to `main` does not deploy the site.** No workflow builds or
deploys, and the repository holds no Firebase credentials. The Firebase site
in `.firebaserc` (`react-shopping-cart-67954.firebaseapp.com`) is the
upstream author's project. It was last deployed in October 2022
(`last-modified: Tue, 25 Oct 2022`), so none of the fullsend work, including
the Red Hat brand filter, is live there. To show a merged change, run
[`rebuild.sh`](#local-demo-rebuildsh) or `npm start` locally.

## Agent flow

Configured in [`.fullsend/config.yaml`](../../.fullsend/config.yaml) (per-repo
install, roles `triage`, `coder`, `review`, `fix`, `retro`, `prioritize`):

```
Jira TSTAPP story
  │ fullsend Jira poll (every 5 min) picks up /fs-triage and /fs-code comments
  ▼
triage agent ── comments on the story: open questions, then "ready", test case
  │ a person comments /fs-code (or /fs-code <instruction>)
  ▼
code agent (fullsend-ai-coder[bot]) ── opens a PR "feat(TSTAPP-N): …", posts the link on the story
  │ pull_request_target → fullsend.yaml
  ▼
review agent (fullsend-ai-review[bot]) ── approves or requests changes
  │ changes requested → fix agent pushes commits → review again
  ▼
auto-merge.yml ── squash-merges the approved commit if every rule passes
  ▼
main  (no deploy)
```

- **Who can start code:** anyone in TSTAPP's Developers project role,
  including people without GitHub access. The `code` agent has no
  `authorization:` block (accepted for the demo, issue #95).
- **Triage auto-promotion:** [`.fullsend/triage.yaml`](../../.fullsend/triage.yaml)
  promotes sufficient issues in `bug`, `performance`, `documentation` and
  `feature` to ready-to-code. `security` and `other` never auto-promote
  (issue #11).
- **Stop the fix agent:** comment `/fs-fix-stop` on the PR (adds the
  `fullsend-no-fix` label). `/fs-fix` re-engages it.
- Run artifacts from Jira-originated runs are metadata only
  (`artifacts.by_source.jira: metadata`).

## Workflows

| Workflow                 | Trigger                                                                | What it does                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fullsend.yaml`          | issues, `/fs-*` comments, `pull_request_target`, PR reviews            | Routes the event to fullsend's `reusable-dispatch.yml` (pinned to v0.56.1), which runs the triage, code, review or fix agent. Also handles `/fs-fix-stop`. Managed by fullsend: do not edit. |
| `fullsend-poll-jira.yml` | cron `2,7,…,57 * * * *`, manual                                        | Polls Jira (site and project from `.fullsend/config.yaml`) and dispatches the agents for new `/fs-*` commands.                                                                               |
| `auto-merge.yml`         | `pull_request_review` submitted; `pull_request` labeled                | Merges approved agent PRs after handling low findings; reports failures and reconciles late ready labels (rules below).                                                                      |
| `auto-merge-tests.yml`   | PRs and pushes to `main` changing the auto-merge workflow or its tests | Runs merge behavior/dispatch tests and actionlint with a read-only token and no secrets.                                                                                                     |
| `prioritize.yml`         | `workflow_dispatch` only                                               | Fullsend RICE scoring into a GitHub Project. Managed by fullsend.                                                                                                                            |
| `security.yml`           | PR to `main`, push to `main`, weekly Monday 06:00 UTC                  | Secret scan with gitleaks over the full history, and `npm audit --omit=dev --audit-level=high` (blocking). A full-tree audit runs but does not block.                                        |

Dependabot (`.github/dependabot.yml`) opens npm and Actions updates monthly.
Its ignore rules hold TypeScript at 4.9 ([`AGENTS.md`](../../AGENTS.md)).

## Checks a PR must pass

**No status check is required, and there is no application build or test CI.**
`auto-merge-tests.yml` tests the merge workflow when it or its tests change.
`security`
runs on PRs, but neither the ruleset nor `auto-merge.yml` waits for it. The
build and tests are checked only by whoever makes the change: the agents run
`npm ci`, `npm run typecheck`, `npm run build` and `CI=true npm test` and
report the results in the PR body. Locally, Husky runs `lint-staged`
(Prettier) before each commit and `commitlint` (Conventional Commits) on the
message.

What `main` does enforce is the **fullsend-ai org ruleset `default-branch`**:

- changes go through a PR. No direct push, force-push or branch deletion.
- **every review thread must be resolved** before merging. On 2026-11-17 this
  blocked the auto-merge of PR #102 ("base branch policy prohibits the
  merge"): the bot had approved, but one thread was still open.
- code-owner review is required, but the repo has no `CODEOWNERS` file, so
  this rule has no effect today. Zero approvals are required.

## Auto-merge rules

[`auto-merge.yml`](../../.github/workflows/auto-merge.yml) squash-merges a PR
only when **all** of these hold:

1. The review that triggered it is an approval by `fullsend-ai-review[bot]`,
   on a non-draft PR authored by `fullsend-ai-coder[bot]`.
2. The PR head is still the reviewed commit (`--match-head-commit`).
3. No reviewer's latest review is `CHANGES_REQUESTED` or `DISMISSED`. A
   person's "request changes" vetoes the merge. A dismissal still vetoes;
   the active ruleset does not make it a trusted human override.
4. Every changed path (old and new names) is under `src/` or `public/`, or is
   the root `firebase.json` or `README.md`. No path may have a dot-prefixed
   segment (`.github/`, `.fullsend/`, …), and no file may be named
   `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` (or their `.local.md` variants), at any depth.
5. Every review thread is resolved. **Only after rules 1–4 pass**, the
   workflow auto-resolves a thread if every comment is by the review bot
   and begins with a `<!-- finding:f_… -->` marker followed immediately by
   an exact `**[low]** category` line. It checks the full comment list,
   re-reads the PR head before mutations, and re-queries all threads before
   merging. Medium/high/critical, info, human replies, missing or malformed
   headers, empty comments, and truncated comment lists remain unresolved.
   Any remaining unresolved thread requires a person to resolve it and merge.
   An API error, partial GraphQL response, or more than 100 threads stops
   auto-merge and is reported; it never silently passes the gate.

Anything else needs a person to merge it. **`docs/` is not on the allowlist**,
so a PR that updates `docs/architecture/` is not merged automatically
today. Widening the allowlist needs an authorizing GitHub issue
cited in the workflow header (issue #11 and issue #98 are the precedents).

This does not mean docs updates should be deferred. A change that alters
behavior these docs describe updates them **in the same PR** and is
human-merged; the PR body says so up front and has no "docs follow-up"
section ([`AGENTS.md`](../../AGENTS.md#architecture-docs), issue #110).

Issue [#104](https://github.com/fullsend-ai/react-shopping-cart/issues/104)
authorizes low-finding auto-resolution and widens this job's
`pull-requests` permission from `read` to `write`. `contents: write` and
`issues: write` are retained for merging, issue closure, comments and labels.
The `default-branch` ruleset remains active, including code-owner approval;
GitHub's merge API is still the final enforcement point. **Accepted risk:**
the review agent's severity decides whether human attention is needed, so a
finding incorrectly tagged low can merge without a person seeing it. A
reply or review arriving between the API checks and mutation/merge remains
a check-then-act race; `--match-head-commit` pins the code, not review state
(the existing demo limitation recorded in #11).

On failure, the workflow removes `ready-for-merge` and posts the failed
guard's reason plus a run link. An API failure names the affected phase;
a merge API failure links to the log for GitHub's specific policy error.
It updates its own marked comment for the same reviewed commit on retries,
ignoring markers copied by other authors. After a successful merge on the
same head, a separate success step replaces the old failure marker with an
auto-merge success note. Late-label cleanup ignores that success marker. A
success-note API failure appears in Actions and cannot post a false merge
refusal after a completed merge. Comment and label operations are
attempted independently, so an unavailable comments API does not prevent
label removal. Label deletion uses the REST issues-label endpoint with
`issues: write`; an HTTP 404 is an idempotent success, while permission and
service errors remain failures. API outages can still prevent reporting and
appear in the failed Actions run.

The review producer posts its approval before adding `ready-for-merge`.
A separate label-event job removes that late label if this workflow has
already recorded failure for the **current** head. It never resolves
threads or merges, and ignores failures for previous heads. Both paths use
separate per-PR **job-level** concurrency groups. Job eligibility is checked
before entering a group, so unrelated labels, non-approving reviews, human
reviews and other skipped events cannot replace pending work. The failure
reporter publishes its marker before removing the label, including removal
on API-error exits;
this covers label events that race ahead of the comment. Skipped events
(human approvals, non-coder PRs, drafts) do not run the merge or failure
reporter.

The thread API uses GraphQL's `fullsend-ai-review` login with actor type
`Bot`; the approval event uses REST's `fullsend-ai-review[bot]`. This is a
GitHub-only repository workflow. GitLab/Forgejo representations are not
accepted or dispatched here, and this change does not alter fullsend's
cross-forge review producer or its review/fix dispatch rules.

The read-only `auto-merge-tests.yml` job runs on PRs and pushes to `main`
when the merge workflow, test files or CI workflow itself change. It runs
the shell behavior and dispatch tests and checksum-pinned actionlint. These
checks do not have write permissions or secrets.

Run locally without GitHub credentials, in an activated Python virtual
environment:

```sh
python3 -m pip install -r .github/tests/requirements.txt
python3 -m unittest discover -s .github/tests -v
actionlint .github/workflows/auto-merge.yml .github/workflows/auto-merge-tests.yml
```

The tests cover guard ordering, exact-low resolution, human replies,
mixed severities, pagination/API errors, duplicate reports and late labels.
They parse the workflow YAML, evaluate its flat job conditions and queue
keys, replace GitHub API calls, and execute the real shell and `jq`. The
small scheduling model checks the documented job-eligibility/concurrency
contract; it does not reproduce the GitHub Actions service. A successful
local test does not prove GitHub's `GITHUB_TOKEN` can resolve bot-authored
threads. Verify that on an eligible bot PR, then watch
the next five approved coder PRs for merge/report behavior (issue #104).
If GitHub denies resolution, the workflow fails closed and reports that a
human must resolve the thread; do not grant a broader secret as a workaround.
The resolution would need a separately reviewed change on the producer side.

The merge runs as `github-actions[bot]` with the workflow's `GITHUB_TOKEN`.
GitHub does not start `push` workflows for commits made with that token, so
an auto-merged commit gets no push-triggered `security` run. For example,
`4cc3b02` (PR #101) had none, while the human-merged `78b28c0` (PR #96) did.
The weekly scan still covers it. This also means a deploy-on-push workflow
added later would **not** fire for auto-merged PRs unless the merge used a
different token or the deploy listened for another event.

## Build and hosting files

| File                              | Role                                                                                                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `firebase.json`                   | Firebase Hosting config: serves `build/`, rewrites every path to `/index.html`, and sets the security headers, including the **Content-Security-Policy**. The CSP lives here, not in `public/index.html`. It is on the auto-merge allowlist. |
| `.firebaserc`                     | Default Firebase project `react-shopping-cart-67954` (upstream's).                                                                                                                                                                           |
| `.firebase/hosting.YnVpbGQ.cache` | Firebase CLI deploy cache, committed from upstream, last changed in 2022.                                                                                                                                                                    |
| `public/index.html`               | HTML template. Loads Google Analytics (`gtag.js`, property `UA-85006284-3`, also upstream's) and `normalize.css`. Has no CSP meta tag.                                                                                                       |
| `package.json` `deploy`           | `firebase deploy`: a manual deploy for someone logged in to the Firebase project. Run `npm run build` first.                                                                                                                                 |
| `Dockerfile`                      | `node:24-alpine`, `npm ci` as the `node` user, then `npm start`: the CRA **dev server** on port 3000, not a production build. `.dockerignore` keeps `.env*`, `.git`, `.github`, `.fullsend` and Firebase files out of the image.             |

### Local demo: `rebuild.sh`

`./rebuild.sh` is the way to show `main` running. It runs
`git pull --ff-only`, builds the image with **podman** as
`localhost/demo-shop:latest`,
runs `npm test -- --watchAll=false` in a throwaway container (the
`CI=true` before `podman run` stays on the host, so Jest's CI mode is off
there and a missing snapshot is written instead of failing), replaces the `demo-shop`
container on **http://localhost:8091**, and then waits for the bundle and
fails if webpack logged "Failed to compile". It has no type check or
production build, so it can pass on code that `npm run build` would reject.

## Open question for the demo

Showing a merged change on a public URL needs a decision first:

- a Firebase project the team owns, replacing `.firebaserc`, with
  credentials stored as a repository secret;
- a deploy workflow on `main`, which must not depend on `push` events from
  auto-merges (see above). For example, run it on `workflow_run` of
  `auto-merge.yml`, or deploy from the merge job itself;
- or keep the demo local with `rebuild.sh`.

A deploy workflow lives under `.github/`, so it is human-merged and outside
what the agents may change.
