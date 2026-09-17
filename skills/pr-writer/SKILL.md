---
name: pr-writer
description: Writes pull request titles and descriptions from the actual diff of a branch, matching the repo's existing PR conventions instead of a generic template. Reads the diff against the base branch, detects a PR template (.github/PULL_REQUEST_TEMPLATE.md) or infers structure from recent merged PRs, groups changes by type, pulls related issue numbers from commit messages or the branch name, and drafts a title following the repo's commit/PR naming convention (conventional commits or otherwise). Use this whenever the user asks to write, draft, or generate a PR description, open a pull request, or summarize a branch's changes for review — even if they just say "write the PR" or "describe this branch."
---

# PR Writer

Purpose: turn a branch's diff into a PR title + description that reads like it was written by someone on this specific team, not a generic "## Changes / ## Testing" template.

## Workflow

### 1. Get the diff

- Determine the base branch (`main`, `master`, or `develop` — check which one the current branch actually diverged from, don't assume)
- Run `git diff <base>...HEAD` (and `git log <base>..HEAD --oneline` for commit messages) to see the full set of changes
- If the diff is large, read it file-by-file rather than all at once, and prioritize understanding _why_ a change was made (check commit messages) over just _what_ changed

### 2. Find the repo's PR conventions, in order of priority

- `.github/PULL_REQUEST_TEMPLATE.md` or `.github/PULL_REQUEST_TEMPLATE/*.md` — if present, this is the required structure; fill it in, don't replace it with your own sections
- `CONTRIBUTING.md` — may state PR title format (e.g. conventional commits: `feat:`, `fix:`, `chore:`), required sections, or a linked-issue convention
- If neither exists, pull the last 5–10 merged PRs (via `gh pr list --state merged --limit 10` or the GitHub tool if connected) and infer the de facto format: heading style, section names, how detailed they usually are, whether screenshots/testing notes are expected

### 3. Extract structure from the changes

- Group changed files by what they actually affect (feature area, layer — frontend/backend/infra — or type: feature, fix, refactor, chore, docs)
- Pull related issue/ticket numbers from commit messages (`fixes #123`, `refs JIRA-456`) or the branch name (`feature/JIRA-456-...`) — link them the way the repo already links them
- Note anything that changes an API contract, DB schema, env vars, or is otherwise a breaking/deploy-relevant change — these should be called out explicitly regardless of template, since reviewers need to catch them
- If the diff touches UI, flag that screenshots would help but don't fabricate a placeholder image — just leave a `<!-- add screenshot -->` note or ask the user for one

### 4. Draft title and description

- Title: follow the repo's actual convention (check recent merged PR titles) — conventional-commit style (`feat(auth): ...`) if that's what's used, plain imperative if not
- Description: fill the detected template if one exists; otherwise use a minimal default — Summary (1–3 sentences on _why_), Changes (grouped bullets), Testing (how it was/should be verified), Related issues
- Keep it factual and scannable — reviewers skim PR descriptions, don't pad with restatements of the diff

### 5. Confirm before opening

Show the drafted title + description to the user first. Don't run `gh pr create` unprompted — only open or update the actual PR if the user explicitly asks after reviewing the draft.
