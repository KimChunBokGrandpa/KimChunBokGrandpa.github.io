## BLOCKED

- issue_id: hourly_auto_run_prompt.md:1:dirty-worktree-untracked-automation-docs
  priority: High
  status: BLOCKED
  file: hourly_auto_run_prompt.md
  line: 1
  summary: Untracked automation prompt documents keep the git worktree dirty and block unattended code fixes.
  next_action: `hourly_auto_run_prompt.md` and `hourly_auto_run_daily_report.md` must be tracked or moved out of the workspace before the next hourly run.
  updated_at: 2026-04-17 13:42 KST

## OPEN

- issue_id: src/lib/components/window/Taskbar.svelte:93:taskbar-nav-label-i18n
  priority: Medium
  status: OPEN
  file: src/lib/components/window/Taskbar.svelte
  line: 93
  summary: The taskbar landmark still exposes a hardcoded English `aria-label`, so KO and JA screen reader output stays untranslated.
  next_action: After the dirty worktree is cleared, add a taskbar landmark label key to `src/lib/i18n/{en,ko,ja}.ts` and wire `Taskbar.svelte` to that key.
  updated_at: 2026-04-17 13:42 KST

## DEFERRED

없음.

## MANUAL_QA

없음.

## NEEDS_REVIEW

없음.

## RECENTLY_RESOLVED

없음.
