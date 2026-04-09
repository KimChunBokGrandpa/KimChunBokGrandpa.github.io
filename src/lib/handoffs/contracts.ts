import type { AppId } from '$lib/projects/schema';

export const CROSS_APP_HANDOFF_VERSION = 1 as const;

export type HandoffIntent =
  | 'place_processed_asset'
  | 'edit_capture'
  | 'place_capture_on_canvas'
  | 'open_export_asset';

export type HandoffOpenMode =
  | 'create_project'
  | 'reuse_empty_project'
  | 'focus_existing_project';

export interface CrossAppHandoffEnvelopeV1 {
  handoffVersion: typeof CROSS_APP_HANDOFF_VERSION;
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

export interface CreateHandoffEnvelopeInput {
  fromAppId: AppId;
  toAppId: AppId;
  intent: HandoffIntent;
  openMode: HandoffOpenMode;
  assetId: string;
  sourceProjectId?: string;
  sourceExportId?: string;
  sourceLabel?: string;
  payload?: Record<string, unknown>;
  handoffId?: string;
  createdAt?: string;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createHandoffId(): string {
  return createId('handoff');
}

export function cloneHandoffEnvelope(
  envelope: CrossAppHandoffEnvelopeV1,
): CrossAppHandoffEnvelopeV1 {
  return {
    ...envelope,
    payload: envelope.payload ? { ...envelope.payload } : undefined,
  };
}

export function createHandoffEnvelope(
  input: CreateHandoffEnvelopeInput,
): CrossAppHandoffEnvelopeV1 {
  return {
    handoffVersion: CROSS_APP_HANDOFF_VERSION,
    handoffId: input.handoffId ?? createHandoffId(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    fromAppId: input.fromAppId,
    toAppId: input.toAppId,
    intent: input.intent,
    openMode: input.openMode,
    assetId: input.assetId,
    sourceProjectId: input.sourceProjectId,
    sourceExportId: input.sourceExportId,
    sourceLabel: input.sourceLabel,
    payload: input.payload ? { ...input.payload } : undefined,
  };
}

