# Delivery

How a change gets from a Jira story to `main`, and what happens after that.
Checked against the repository and its GitHub settings on 2026-11-17.

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

| Workflow                 | Trigger                                                     | What it does                                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fullsend.yaml`          | issues, `/fs-*` comments, `pull_request_target`, PR reviews | Routes the event to fullsend's `reusable-dispatch.yml` (pinned to v0.56.1), which runs the triage, code, review or fix agent. Also handles `/fs-fix-stop`. Managed by fullsend: do not edit. |
| `fullsend-poll-jira.yml` | cron `2,7,…,57 * * * *`, manual                             | Polls Jira (site and project from `.fullsend/config.yaml`) and dispatches the agents for new `/fs-*` commands.                                                                               |
| `auto-merge.yml`         | `pull_request_review` submitted                             | Merges agent PRs on a clean bot review (rules below).                                                                                                                                        |
| `prioritize.yml`         | `workflow_dispatch` only                                    | Fullsend RICE scoring into a GitHub Project. Managed by fullsend.                                                                                                                            |
| `security.yml`           | PR to `main`, push to `main`, weekly Monday 06:00 UTC       | Secret scan with gitleaks over the full history, and `npm audit --omit=dev --audit-level=high` (blocking). A full-tree audit runs but does not block.                                        |

Dependabot (`.github/dependabot.yml`) opens npm and Actions updates monthly.
Its ignore rules hold TypeScript at 4.9 ([`AGENTS.md`](../../AGENTS.md)).

## Checks a PR must pass

**No status check is required, and there is no build or test CI.** `security`
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
   person's "request changes" vetoes the merge.
4. Every changed path (old and new names) is under `src/` or `public/`, or is
   the root `firebase.json` or `README.md`. No path may have a dot-prefixed
   segment (`.github/`, `.fullsend/`, …), and no file may be named
   `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` (or their `.local.md` variants), at any depth.

Anything else needs a person to merge it. **`docs/` is not on the allowlist**,
so a PR that updates `docs/architecture/`, as `AGENTS.md` asks, is not merged
automatically today. Widening the allowlist needs an authorizing GitHub issue
cited in the workflow header (issue #11 and issue #98 are the precedents).

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

`./rebuild.sh` is the way to show `main` running. It runs `git pull
--ff-only`, builds the image with **podman** as `localhost/demo-shop:latest`,
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
