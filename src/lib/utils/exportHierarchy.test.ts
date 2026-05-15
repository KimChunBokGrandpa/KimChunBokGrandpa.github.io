import { describe, expect, it } from 'vitest';

import {
  buildExportViewModel,
  type ExportStoreSnapshot,
  type ExportViewModelInput,
  type ExportSecondaryActionId,
  type ExportSectionId,
} from './exportHierarchy';
import type { ExportCapability } from './exportCapability';

// ─── Helpers ───

function makeSnapshot(overrides: Partial<ExportStoreSnapshot> = {}): ExportStoreSnapshot {
  return {
    hasLoadedImage: true,
    hasProcessedImage: true,
    hasUnappliedChanges: false,
    autoProcess: true,
    stillSaveBusy: false,
    animationSaveBusy: false,
    mediaKind: 'still',
    saveFormat: 'png',
    saveQuality: 92,
    exportHistory: [],
    ...overrides,
  };
}

function makeCapability(overrides: Partial<ExportCapability> = {}): ExportCapability {
  return {
    canShareStill: true,
    canExportSvgStill: true,
    canExportApng: true,
    canExportAnimatedSvg: true,
    canExportAnimatedWebp: true,
    canExportSpritesheet: true,
    canExportFrameSequence: true,
    ...overrides,
  };
}

function makeInput(overrides: {
  snapshot?: Partial<ExportStoreSnapshot>;
  capability?: Partial<ExportCapability>;
  primaryShortcutHint?: string;
} = {}): ExportViewModelInput {
  return {
    snapshot: makeSnapshot(overrides.snapshot),
    capability: makeCapability(overrides.capability),
    t: (key: string) => key,
    primaryShortcutHint: overrides.primaryShortcutHint ?? 'Ctrl+S',
  };
}

// ─── Tests ───

describe('buildExportViewModel', () => {
  describe('mediaKind = none', () => {
    it('returns primary=null and sections=[]', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'none' } }));

      expect(vm.primary).toBeNull();
      expect(vm.sections).toEqual([]);
      expect(vm.mediaKind).toBe('none');
      expect(vm.hasProcessedImage).toBe(false);
      expect(vm.busy).toBe(false);
      expect(vm.cancel).toBeNull();
    });

    it('sets formatSelector.visible=false', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'none' } }));

      expect(vm.formatSelector.visible).toBe(false);
    });
  });

  describe('mediaKind = still', () => {
    it('sets primary.id to save-still', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));

      expect(vm.primary).not.toBeNull();
      expect(vm.primary!.id).toBe('save-still');
      expect(vm.primary!.labelKey).toBe('save_as');
    });

    it('sets subLabel to format uppercase (PNG)', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', saveFormat: 'png' } }),
      );

      expect(vm.primary!.subLabel).toBe('PNG');
    });

    it('sets subLabel to format uppercase (JPEG)', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', saveFormat: 'jpeg' } }),
      );

      expect(vm.primary!.subLabel).toBe('JPEG');
    });

    it('sets subLabel to format uppercase (WEBP)', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', saveFormat: 'webp' } }),
      );

      expect(vm.primary!.subLabel).toBe('WEBP');
    });

    it('includes share-still and export-svg-still in still-variants section', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));

      expect(vm.sections).toHaveLength(1);
      expect(vm.sections[0].id).toBe('still-variants');
      expect(vm.sections[0].labelKey).toBe('export_section_still');

      const actionIds = vm.sections[0].actions.map((a) => a.id);
      expect(actionIds).toContain('share-still');
      expect(actionIds).toContain('export-svg-still');
    });

    it('sets formatSelector.visible=true', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));

      expect(vm.formatSelector.visible).toBe(true);
    });

    it('sets showsQualitySlider=false for png', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', saveFormat: 'png' } }),
      );

      expect(vm.formatSelector.showsQualitySlider).toBe(false);
    });

    it('sets showsQualitySlider=true for jpeg', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', saveFormat: 'jpeg' } }),
      );

      expect(vm.formatSelector.showsQualitySlider).toBe(true);
    });

    it('sets showsQualitySlider=true for webp', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', saveFormat: 'webp' } }),
      );

      expect(vm.formatSelector.showsQualitySlider).toBe(true);
    });

    it('does not include animation-variants section', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));

      const sectionIds = vm.sections.map((s) => s.id);
      expect(sectionIds).not.toContain('animation-variants');
    });

    it('cancel is null for still', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));

      expect(vm.cancel).toBeNull();
    });
  });

  describe('mediaKind = animation', () => {
    it('sets primary.id to export-gif', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      expect(vm.primary).not.toBeNull();
      expect(vm.primary!.id).toBe('export-gif');
      expect(vm.primary!.labelKey).toBe('export_gif');
    });

    it('does not set subLabel for animation', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      expect(vm.primary!.subLabel).toBeUndefined();
    });

    it('includes animation-variants section with all animation actions', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      expect(vm.sections).toHaveLength(1);
      expect(vm.sections[0].id).toBe('animation-variants');
      expect(vm.sections[0].labelKey).toBe('export_section_animation');

      const actionIds = vm.sections[0].actions.map((a) => a.id);
      expect(actionIds).toContain('export-apng');
      expect(actionIds).toContain('export-animated-svg');
      expect(actionIds).toContain('export-animated-webp');
      expect(actionIds).toContain('export-spritesheet');
      expect(actionIds).toContain('export-frame-sequence');
    });

    it('does not include share-still in animation sections', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('share-still');
    });

    it('does not include export-svg-still in animation sections', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-svg-still');
    });

    it('does not include still-variants section', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      const sectionIds = vm.sections.map((s) => s.id);
      expect(sectionIds).not.toContain('still-variants');
    });

    it('sets formatSelector.visible=false for animation', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      expect(vm.formatSelector.visible).toBe(false);
    });
  });

  describe('capability gating', () => {
    it('excludes share-still when canShareStill=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still' },
          capability: { canShareStill: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('share-still');
    });

    it('excludes export-svg-still when canExportSvgStill=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still' },
          capability: { canExportSvgStill: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-svg-still');
    });

    it('omits still-variants section entirely when no still actions available', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still' },
          capability: { canShareStill: false, canExportSvgStill: false },
        }),
      );

      expect(vm.sections).toHaveLength(0);
    });

    it('excludes export-apng when canExportApng=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
          capability: { canExportApng: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-apng');
    });

    it('excludes export-animated-svg when canExportAnimatedSvg=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
          capability: { canExportAnimatedSvg: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-animated-svg');
    });

    it('excludes export-animated-webp when canExportAnimatedWebp=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
          capability: { canExportAnimatedWebp: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-animated-webp');
    });

    it('excludes export-spritesheet when canExportSpritesheet=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
          capability: { canExportSpritesheet: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-spritesheet');
    });

    it('excludes export-frame-sequence when canExportFrameSequence=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
          capability: { canExportFrameSequence: false },
        }),
      );

      const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
      expect(allActionIds).not.toContain('export-frame-sequence');
    });

    it('omits animation-variants section entirely when no animation actions available', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
          capability: {
            canExportApng: false,
            canExportAnimatedSvg: false,
            canExportAnimatedWebp: false,
            canExportSpritesheet: false,
            canExportFrameSequence: false,
          },
        }),
      );

      expect(vm.sections).toHaveLength(0);
    });
  });

  describe('blocked state', () => {
    it('sets primary.blocked=true when autoProcess=false and hasUnappliedChanges=true', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'still',
            autoProcess: false,
            hasUnappliedChanges: true,
          },
        }),
      );

      expect(vm.primary!.blocked).toBe(true);
    });

    it('sets primary.blocked=false when autoProcess=true', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'still',
            autoProcess: true,
            hasUnappliedChanges: true,
          },
        }),
      );

      expect(vm.primary!.blocked).toBe(false);
    });

    it('sets primary.blocked=false when hasUnappliedChanges=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'still',
            autoProcess: false,
            hasUnappliedChanges: false,
          },
        }),
      );

      expect(vm.primary!.blocked).toBe(false);
    });

    it('blocked state applies to animation primary too', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'animation',
            autoProcess: false,
            hasUnappliedChanges: true,
          },
        }),
      );

      expect(vm.primary!.blocked).toBe(true);
    });
  });

  describe('busy state', () => {
    it('sets primary.busy=true when stillSaveBusy=true for still', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still', stillSaveBusy: true },
        }),
      );

      expect(vm.primary!.busy).toBe(true);
      expect(vm.busy).toBe(true);
    });

    it('sets primary.busy=false when stillSaveBusy=false for still', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still', stillSaveBusy: false },
        }),
      );

      expect(vm.primary!.busy).toBe(false);
      expect(vm.busy).toBe(false);
    });

    it('sets primary.busy=true when animationSaveBusy=true for animation', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation', animationSaveBusy: true },
        }),
      );

      expect(vm.primary!.busy).toBe(true);
      expect(vm.busy).toBe(true);
    });

    it('disables all animation variants when animationSaveBusy=true', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation', animationSaveBusy: true },
        }),
      );

      for (const section of vm.sections) {
        for (const action of section.actions) {
          expect(action.disabled).toBe(true);
        }
      }
    });

    it('sets cancel.visible=true when animationSaveBusy=true', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation', animationSaveBusy: true },
        }),
      );

      expect(vm.cancel).not.toBeNull();
      expect(vm.cancel!.visible).toBe(true);
      expect(vm.cancel!.labelKey).toBe('cancel');
    });

    it('sets cancel=null when animationSaveBusy=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation', animationSaveBusy: false },
        }),
      );

      expect(vm.cancel).toBeNull();
    });

    it('animation variants are not disabled when animationSaveBusy=false', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation', animationSaveBusy: false },
        }),
      );

      for (const section of vm.sections) {
        for (const action of section.actions) {
          expect(action.disabled).toBe(false);
        }
      }
    });
  });

  describe('Poster Maker exclusion', () => {
    const allMediaKinds = ['none', 'still', 'animation'] as const;
    const allCapabilityCombinations = [
      makeCapability(),
      makeCapability({ canShareStill: false }),
      makeCapability({ canExportSvgStill: false }),
      makeCapability({ canExportApng: false }),
    ];

    for (const mediaKind of allMediaKinds) {
      for (const capability of allCapabilityCombinations) {
        it(`does not include poster-maker actions for mediaKind=${mediaKind}`, () => {
          const vm = buildExportViewModel(
            makeInput({ snapshot: { mediaKind }, capability }),
          );

          // Check sections don't contain any poster-maker related ids
          const allSectionIds = vm.sections.map((s) => s.id);
          expect(allSectionIds).not.toContain('handoff' as ExportSectionId);

          const allActionIds = vm.sections.flatMap((s) => s.actions.map((a) => a.id));
          expect(allActionIds).not.toContain('send-to-poster-maker' as ExportSecondaryActionId);

          // Check primary is never poster-maker related
          if (vm.primary) {
            expect(vm.primary.id).not.toBe('send-to-poster-maker');
            expect(vm.primary.testId).not.toBe('send-to-poster-maker-button');
          }
        });
      }
    }
  });

  describe('export history', () => {
    it('returns history.latest=null when exportHistory is empty', () => {
      const vm = buildExportViewModel(
        makeInput({ snapshot: { mediaKind: 'still', exportHistory: [] } }),
      );

      expect(vm.history.latest).toBeNull();
      expect(vm.history.placeholderLabelKey).toBe('export_history_empty');
    });

    it('returns history.latest from first entry with dimensions', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'still',
            exportHistory: [
              {
                exportId: 'exp-1',
                createdAt: '2024-06-15T12:00:00.000Z',
                format: 'png',
                width: 640,
                height: 480,
              },
            ],
          },
        }),
      );

      expect(vm.history.latest).not.toBeNull();
      expect(vm.history.latest!.exportId).toBe('exp-1');
      expect(vm.history.latest!.format).toBe('PNG');
      expect(vm.history.latest!.createdAtIso).toBe('2024-06-15T12:00:00.000Z');
      expect(vm.history.latest!.dimensions).toBe('640×480');
    });

    it('returns dimensions=null when width or height is missing', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'still',
            exportHistory: [
              {
                exportId: 'exp-2',
                createdAt: '2024-06-15T12:00:00.000Z',
                format: 'jpeg',
              },
            ],
          },
        }),
      );

      expect(vm.history.latest!.dimensions).toBeNull();
    });

    it('returns dimensions=null when only width is present', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: {
            mediaKind: 'still',
            exportHistory: [
              {
                exportId: 'exp-3',
                createdAt: '2024-06-15T12:00:00.000Z',
                format: 'webp',
                width: 800,
              },
            ],
          },
        }),
      );

      expect(vm.history.latest!.dimensions).toBeNull();
    });
  });

  describe('tooltip and ariaLabel', () => {
    it('uses primaryShortcutHint as tooltip', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still' },
          primaryShortcutHint: 'Cmd+S',
        }),
      );

      expect(vm.primary!.tooltip).toBe('Cmd+S');
    });

    it('constructs ariaLabel for still with format', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'still', saveFormat: 'png' },
        }),
      );

      // t returns the key as-is, so ariaLabel = 'save_as · PNG'
      expect(vm.primary!.ariaLabel).toBe('save_as · PNG');
    });

    it('constructs ariaLabel for animation', () => {
      const vm = buildExportViewModel(
        makeInput({
          snapshot: { mediaKind: 'animation' },
        }),
      );

      // t returns the key as-is, so ariaLabel = 'export_gif'
      expect(vm.primary!.ariaLabel).toBe('export_gif');
    });
  });

  describe('section ordering', () => {
    it('still-variants always comes before animation-variants (fixed order)', () => {
      // This test verifies the design constraint even though in practice
      // still and animation sections don't appear together.
      // The builder only produces one section type per media kind.
      const vmStill = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));
      const vmAnim = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));

      if (vmStill.sections.length > 0) {
        expect(vmStill.sections[0].id).toBe('still-variants');
      }
      if (vmAnim.sections.length > 0) {
        expect(vmAnim.sections[0].id).toBe('animation-variants');
      }
    });
  });

  describe('testId on primary', () => {
    it('always uses save-image-button as testId for still', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));
      expect(vm.primary!.testId).toBe('save-image-button');
    });

    it('always uses save-image-button as testId for animation', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'animation' } }));
      expect(vm.primary!.testId).toBe('save-image-button');
    });
  });

  describe('share-still testId', () => {
    it('share-still action has testId share-image-button', () => {
      const vm = buildExportViewModel(makeInput({ snapshot: { mediaKind: 'still' } }));
      const shareAction = vm.sections[0].actions.find((a) => a.id === 'share-still');
      expect(shareAction!.testId).toBe('share-image-button');
    });
  });
});
