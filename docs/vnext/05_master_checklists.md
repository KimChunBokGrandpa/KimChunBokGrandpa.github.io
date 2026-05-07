# Master Checklists for vNext

---

## 0. Contract Readiness Checklist

- [ ] `01_product_vision.md` reflects Pixel Lab as the main product
- [ ] `02_program_suite.md` keeps Poster Maker and RetroCam as supporting surfaces
- [ ] `07_app_taxonomy_spec.md` matches the shell language
- [ ] `08_project_schema_spec.md` matches persistence work
- [ ] `09_cross_app_handoff_spec.md` matches inter-app routing work
- [ ] `10_role_execution_plan.md` still matches the active delivery order
- [ ] no implementation task proceeds by redefining these contracts ad hoc

---

## 1. Product Direction Checklist

- [ ] The feature supports Pixel Lab's core editing loop
- [ ] The feature improves Classic Pixel output, Retro Treatment output, recommendation quality, or export reliability
- [ ] The feature works inside the client-only architecture
- [ ] The feature is classified as `Pixel Lab core`, `shared engine`, `recommendation`, `supporting app`, or `shell`
- [ ] The feature has a clear user-facing job-to-be-done
- [ ] The feature does not expand supporting apps without strengthening Pixel Lab input/output value

---

## 2. Recommendation Checklist

- [ ] Existing or new presets are classified as `Classic Pixel`, `Retro Treatment`, or a clearly justified hybrid
- [ ] Recommendation reasons map to visible image traits or known preset behavior
- [ ] The UI presents recommendations as starting points, not irreversible automation
- [ ] Manual controls remain available after applying a recommendation
- [ ] Reproduced recommendation edge cases receive targeted tests
- [ ] Copy does not overclaim intelligence or remote AI behavior

---

## 3. Pixel Lab Checklist

- [ ] Pixel Lab name appears consistently in shell-facing UI
- [ ] Existing converter workflow remains stable
- [ ] Import/upload remains obvious
- [ ] Classic Pixel controls remain available
- [ ] Retro Treatment controls remain available
- [ ] Save/share/export still work after app reframing
- [ ] Preset, batch, and gallery relationships remain understandable
- [ ] Technical controls remain available without becoming cluttered

---

## 4. Shared Engine Checklist

- [ ] Shared image pipeline boundaries are explicit
- [ ] Quantizer, palette, dithering, scale, and effect-layer behavior remain coherent
- [ ] Shared presets stay compatible across apps where intended
- [ ] Export primitives are reusable
- [ ] Local asset handoff is defined
- [ ] Project metadata format is documented
- [ ] Canonical project persistence avoids transient-only blob URL dependence
- [ ] `localStorage` is not treated as the canonical store for full project payloads
- [ ] No shared state mutation leaks silently across apps

---

## 5. Shell Implementation Checklist

- [ ] Pixel Lab is visually the primary desktop entry
- [ ] Poster Maker and RetroCam remain understandable supporting entries
- [ ] Taskbar entries reflect running apps clearly
- [ ] Window titles follow app-specific naming rules
- [ ] Launch behavior is consistent
- [ ] Minimize/restore/focus flows remain coherent
- [ ] Toasts/messages still feel system-wide, not app-confusing
- [ ] Mobile and narrow-view behavior still preserves Pixel Lab identity

---

## 6. Poster Maker Checklist

- [ ] Poster Maker launches from desktop
- [ ] At least one canvas/document preset exists
- [ ] Text workflow exists
- [ ] Image placement workflow exists
- [ ] Overlay/frame/sticker support exists at MVP level
- [ ] Export to local file works
- [ ] Pixel Lab output handoff remains stable
- [ ] Poster Maker does not become the default path for image refinement

---

## 7. RetroCam Checklist

- [ ] RetroCam launches from desktop
- [ ] Capture input works locally
- [ ] Fast preset switching works
- [ ] Snapshot export works
- [ ] `Open in Pixel Lab` remains the primary handoff
- [ ] `short-loop export` is only required if a future slice explicitly reopens it
- [ ] Error states for permission/input are handled
- [ ] Reopened snapshot save uses the stored snapshot asset, not a stale live canvas

---

## 8. UX Checklist

- [ ] User can understand Pixel Lab's purpose within seconds
- [ ] User can choose or accept a recommended direction quickly
- [ ] Common actions are discoverable without tutorials
- [ ] Keyboard and pointer interactions are still consistent
- [ ] Window clutter is manageable
- [ ] Copy reflects local software/editor language, not cloud platform language
- [ ] Onboarding supports the Pixel Lab-first mental model

### Web Usability Guardrail

- [ ] Browser-first usage is still clear without explaining the concept first
- [ ] Core actions remain readable and discoverable on the web page
- [ ] Novel shell styling does not hide save/open/recommend/capture/export actions

### Win98 Identity Guardrail

- [ ] The shell still reads clearly as Win98-inspired software
- [ ] New program surfaces still belong to the same fictional desktop OS
- [ ] Modern UI patterns have not diluted the retro desktop identity unnecessarily

### Mobile Guardrail

- [ ] Core flows remain usable on a tall-phone viewport around `19.5:9`
- [ ] Mobile layout preserves Pixel Lab identity, not generic stacked-page behavior
- [ ] Important actions remain visible and reachable without broken scrolling/clipping

---

## 9. Client-Only Architecture Checklist

- [ ] No required remote API was introduced
- [ ] No account/login dependency was introduced
- [ ] No cloud persistence assumption was introduced
- [ ] No remote AI inference assumption was introduced for recommendations
- [ ] Local storage/project persistence strategy is documented
- [ ] Browser and Tauri local behavior remain aligned
- [ ] Any optional network idea is clearly excluded from core scope

---

## 10. QA Checklist

- [ ] Unit tests cover new shared logic
- [ ] Component tests cover new app launch and shell interactions
- [ ] Integration tests cover cross-program handoff
- [ ] Existing export and save regressions are checked
- [ ] Recommendation edge cases are covered when reproduced
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

- [ ] Pixel Lab recommendation flow is understandable
- [ ] Shell naming and app naming are consistent
- [ ] Desktop icon set is stable
- [ ] Core app launch flows work from a fresh session
- [ ] Project restore behavior is predictable
- [ ] Export/save/share flows are validated
- [ ] Main marketing/screenshots show the Pixel Lab-first editor clearly
- [ ] Release notes explain the shift to recommendation-led classic pixelization and retro treatment
