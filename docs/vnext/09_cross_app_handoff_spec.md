# Cross-App Handoff Specification

---

## Purpose

Define how one program passes a local asset or editing outcome into another program while keeping the suite fast, understandable, and strictly client-only.

This document is the contract for:

- handoff envelope format
- supported app-to-app flows
- target app opening behavior
- failure handling
- provenance rules

---

## Core Principles

- handoffs are local-only
- handoffs pass references, not remote URLs
- source app state must remain intact if the handoff fails
- target app behavior must be predictable from the command label
- every received asset should keep provenance metadata

---

## Canonical Handoff Terms

### Handoff

A local transfer request created by one program and consumed by another.

### Handoff Envelope

A versioned structured payload describing:

- source app
- target app
- intent
- referenced asset
- preferred opening mode

### Imported Asset

A target-app asset that references or copies a locally stored source asset.

### Provenance

Metadata that explains where the asset came from and how it entered the target app.

---

## Handoff Lifecycle

1. Source app finalizes the outgoing local asset reference
2. Source app writes any required derived asset to local storage if it is not already durable
3. Source app creates a handoff envelope
4. Shell opens or focuses the target app
5. Target app resolves the asset reference and applies the requested intent
6. Target app surfaces success or failure locally

If any step fails, the source workflow must remain usable.

---

## Envelope Schema

```ts
type AppId = 'pixel-lab' | 'poster-maker' | 'retrocam';

type HandoffIntent =
  | 'place_processed_asset'
  | 'edit_capture'
  | 'place_capture_on_canvas'
  | 'open_export_asset';

type HandoffOpenMode =
  | 'create_project'
  | 'reuse_empty_project'
  | 'focus_existing_project';

interface CrossAppHandoffEnvelopeV1 {
  handoffVersion: 1;
  handoffId: string;
  createdAt: string;
  fromAppId: AppId;
  toAppId: AppId;
  intent: HandoffIntent;
  openMode: HandoffOpenMode;
  assetId: string;
  sourceProjectId?: string;
  sourceExportId?: string;
  sourceLabel?: string;
  payload?: Record<string, unknown>;
}
```

### Field Rules

| Field | Rule |
|---|---|
| `handoffVersion` | versioned to allow future expansion |
| `handoffId` | unique per request |
| `fromAppId` / `toAppId` | explicit app ownership |
| `intent` | target behavior must map from this |
| `openMode` | defines project/window creation preference |
| `assetId` | references a durable local asset |
| `payload` | optional intent-specific metadata |

---

## Supported MVP Handoffs

### 1. Pixel Lab -> Poster Maker

Command label:

- `Send to Poster Maker`

Intent:

- `place_processed_asset`

Expected behavior:

- if Poster Maker has no suitable open document, create a new poster project
- place the processed asset on the canvas as the primary image layer
- focus Poster Maker after launch

Suggested payload:

```ts
{
  preferredDocumentPresetId?: string;
  placeMode?: 'fit-center' | 'cover' | 'original-size';
}
```

### 2. RetroCam -> Pixel Lab

Command label:

- `Open in Pixel Lab`

Intent:

- `edit_capture`

Expected behavior:

- create a new Pixel Lab project when the current workspace is non-empty
- otherwise allow `reuse_empty_project`
- load the captured asset as the active source image

### 3. RetroCam -> Poster Maker

Command label:

- `Use in Poster Maker`

Intent:

- `place_capture_on_canvas`

Expected behavior:

- create or reuse an empty poster document
- place the capture as an image layer

### Deferred Handoffs

Not required for MVP:

- Poster Maker -> Pixel Lab round-trip editing
- multi-asset batch handoff
- shell-wide `Open With` routing for every file type

---

## Open Mode Rules

### `create_project`

Always create a new target project.

Use when:

- the source result should not overwrite target work
- the incoming asset defines a new creative branch

### `reuse_empty_project`

Reuse the current target project only if it is effectively blank.

Use when:

- the target app is already open
- reusing an untouched canvas/workspace avoids friction

### `focus_existing_project`

Focus an already open compatible project.

Use sparingly in MVP because it is easiest to confuse users unless compatibility is obvious.

---

## Target Resolution Rules

The receiving app must:

- verify that `assetId` resolves locally
- validate that the intent is supported
- decide project creation using `openMode`
- record provenance metadata in its local project state
- surface a user-facing result message

The receiving app must not:

- silently destroy current unsaved work
- ignore the intent and do something unrelated
- treat transient object URLs as durable storage

---

## Provenance Rules

Every imported asset should preserve:

- `originAppId`
- source `assetId`
- optional `sourceProjectId`
- handoff timestamp
- handoff intent

This information should be accessible for debugging and may later power "Open Source Project" affordances.

---

## UX Rules

### Source App

- command labels must name the target program explicitly
- handoff actions should feel like deliberate routing, not generic export
- user should understand whether the target will open a new document or reuse an empty one

### Target App

- target app must visibly focus after successful handoff
- imported asset should be visible immediately on first render
- failure states should remain inside the target app or global toast layer

### Copy Rules

Good:

- `Send to Poster Maker`
- `Open in Pixel Lab`

Bad:

- `Continue`
- `Use`
- `Forward`

---

## Failure Handling

If a handoff fails:

- source app remains unchanged
- target app should show a clear local error if it was opened
- user should be able to retry without reloading the whole suite

Failure reasons to account for:

- missing local asset
- incompatible intent
- corrupted manifest or adapter failure
- target app launch failure

---

## Storage and Transport Guidance

### Required Rule

The handoff envelope may be transient, but the referenced asset must already be in durable local storage before the target relies on it.

### Suggested MVP Implementation Shape

- `handoffBus` or shared shell store for the transient envelope
- shared asset registry / adapter for durable asset lookup
- target app consumes and clears the envelope after successful resolution

The exact runtime mechanism can change, but the contract must remain stable.

---

## QA Scenarios

- Pixel Lab processed image successfully opens in Poster Maker
- RetroCam snapshot successfully opens in Pixel Lab
- handoff fails gracefully when asset lookup fails
- repeated handoff does not overwrite unrelated target work
- target app focus behavior is correct after handoff

---

## Acceptance Criteria

- the team can implement a stable envelope type without guessing intent semantics
- the first Pixel Lab -> Poster Maker flow can ship without reinterpreting product behavior
- source/target ownership is preserved for every successful handoff
- all handoffs remain fully client-only
