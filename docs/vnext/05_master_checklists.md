# Master Checklists for vNext

---

## 0. Contract Readiness Checklist

- [ ] `07_app_taxonomy_spec.md` is current and matches the shell language
- [ ] `08_project_schema_spec.md` is current and matches persistence work
- [ ] `09_cross_app_handoff_spec.md` is current and matches inter-app routing work
- [ ] `10_role_execution_plan.md` still matches the active delivery order
- [ ] no implementation task proceeds by redefining these contracts ad hoc

---

## 1. Product Direction Checklist

- [ ] The feature supports the `retro creative desktop` positioning
- [ ] The feature works inside the client-only architecture
- [ ] The feature is classified as `shell`, `shared engine`, or `program-specific`
- [ ] The feature has a clear user-facing job-to-be-done
- [ ] The feature does not duplicate an existing workflow without stronger app framing
- [ ] The feature strengthens the "launchable programs" fantasy

---

## 2. App Definition Checklist

Use before promoting any workflow into its own desktop program.

- [ ] The workflow has a distinct purpose
- [ ] The workflow can be launched directly from the desktop
- [ ] The workflow has its own icon and title identity
- [ ] The workflow has a meaningful first screen
- [ ] The workflow can reach a finished result on its own
- [ ] The workflow is not just a settings subset of another app
- [ ] The workflow has clear entry/exit points

---

## 3. Shell Implementation Checklist

- [ ] Desktop icons exist for all first-party programs
- [ ] Taskbar entries reflect running apps clearly
- [ ] Window titles follow app-specific naming rules
- [ ] Launch behavior is consistent
- [ ] Minimize/restore/focus flows remain coherent
- [ ] Toasts/messages still feel system-wide, not app-confusing
- [ ] Mobile and narrow-view behavior still preserves app identity

---

## 4. Shared Engine Checklist

- [ ] Shared image pipeline boundaries are explicit
- [ ] Shared presets stay compatible across apps where intended
- [ ] Export primitives are reusable
- [ ] Local asset handoff is defined
- [ ] Project metadata format is documented
- [ ] Canonical project persistence avoids transient-only blob URL dependence
- [ ] `localStorage` is not treated as the canonical store for full project payloads
- [ ] No shared state mutation leaks silently across apps

---

## 5. Pixel Lab Checklist

- [ ] Pixel Lab name appears consistently in shell-facing UI
- [ ] Existing converter workflow remains stable
- [ ] Save/share/export still work after app reframing
- [ ] Preset, batch, and gallery relationships remain understandable
- [ ] Technical controls remain available without becoming cluttered

---

## 6. Poster Maker Checklist

- [ ] Poster Maker launches from desktop
- [ ] At least one canvas/document preset exists
- [ ] Text workflow exists
- [ ] Image placement workflow exists
- [ ] Overlay/frame/sticker support exists at MVP level
- [ ] Export to local file works
- [ ] At least one cross-program handoff from Pixel Lab exists

---

## 7. RetroCam Checklist

- [ ] RetroCam launches from desktop
- [ ] Capture input works locally
- [ ] Fast preset switching works
- [ ] Snapshot or short-loop export works
- [ ] Error states for permission/input are handled
- [ ] At least one handoff to another app exists

---

## 8. UX Checklist

- [ ] User can understand each app's purpose within seconds
- [ ] No program feels like a disguised tab
- [ ] Common actions are discoverable without tutorials
- [ ] Keyboard and pointer interactions are still consistent
- [ ] Window clutter is manageable
- [ ] Copy reflects software/app language, not feature-panel language
- [ ] Onboarding supports the multi-program mental model

---

## 9. Client-Only Architecture Checklist

- [ ] No required remote API was introduced
- [ ] No account/login dependency was introduced
- [ ] No cloud persistence assumption was introduced
- [ ] Local storage/project persistence strategy is documented
- [ ] Browser and Tauri local behavior remain aligned
- [ ] Any optional network idea is clearly excluded from core scope

---

## 10. QA Checklist

- [ ] Unit tests cover new shared logic
- [ ] Component tests cover new app launch and shell interactions
- [ ] Integration tests cover cross-program handoff
- [ ] Existing export and save regressions are checked
- [ ] Mobile/narrow viewport behavior is checked
- [ ] Accessibility states are reviewed
- [ ] Client-only assumptions are preserved in tests and docs
- [ ] Regression matrix is aligned to the current priority tier in `10_role_execution_plan.md`

---

## 11. Documentation Checklist

- [ ] README still describes the product correctly
- [ ] PLAN_TASK reflects current active work, not stale ideation
- [ ] REVISION_HISTORY records major directional changes
- [ ] vNext docs remain internally consistent
- [ ] contract docs 07-10 stay linked from the vNext index
- [ ] Deleted docs are truly superseded by current documents
- [ ] New work references the relevant vNext documents

---

## 12. Release Readiness Checklist

- [ ] Shell naming and app naming are consistent
- [ ] Desktop icon set is stable
- [ ] Core app launch flows work from a fresh session
- [ ] Project restore behavior is predictable
- [ ] Export/save/share flows are validated
- [ ] Main marketing/screenshots show multi-program identity clearly
- [ ] Release notes explain the shift from single tool to retro desktop suite
