<script lang="ts">
  import {
    buildShortcutLabel,
    replacePrimaryModifierShortcutLabel,
  } from '$lib/utils/platformShortcuts';

  const typeScale = [
    {
      name: 'Heading',
      token: '--w98-font-size-heading',
      size: '15px',
      sample: 'Desktop Notice / Program Title',
    },
    {
      name: 'Action',
      token: '--w98-font-size-action',
      size: '13px',
      sample: 'Open Image / Save As',
    },
    {
      name: 'Base',
      token: '--w98-font-size-base',
      size: '12px',
      sample: 'Default UI copy and controls',
    },
    {
      name: 'Small',
      token: '--w98-font-size-sm',
      size: '11px',
      sample: 'Helper text and secondary controls',
    },
    {
      name: 'Caption',
      token: '--w98-font-size-caption',
      size: '10px',
      sample: 'Format lists and tiny labels',
    },
    {
      name: 'Micro',
      token: '--w98-font-size-micro',
      size: '9px',
      sample: 'Dense badges and compact utility copy',
    },
  ];

  const spacingScale = [
    { size: '2px', use: 'tight icon and label offsets' },
    { size: '4px', use: 'titlebar gaps and compact control spacing' },
    { size: '6px', use: 'toolbar and inline action spacing' },
    { size: '8px', use: 'panel padding and card body gaps' },
    { size: '12px', use: 'dialog body padding and primary action spacing' },
    { size: '16px', use: 'desktop callout padding and drop message shells' },
  ];

  const iconography = [
    { emoji: '🖼️', label: 'Pixel Lab' },
    { emoji: '📷', label: 'RetroCam' },
    { emoji: '⚙️', label: 'Controls' },
    { emoji: '🎨', label: 'Palette Gallery' },
    { emoji: '📦', label: 'Batch' },
    { emoji: '⏱️', label: 'History' },
    { emoji: '📂', label: 'Open' },
    { emoji: '💾', label: 'Save' },
    { emoji: '📥', label: 'Drop' },
    { emoji: '⚠️', label: 'Warning' },
    { emoji: 'ℹ️', label: 'Notice' },
  ];

  const structuralIcons = [
    { glyph: '⊞', label: 'Start' },
    { glyph: '✕', label: 'Close' },
    { glyph: '▶', label: 'Apply' },
    { glyph: '▼', label: 'Expand' },
    { glyph: '↺', label: 'Undo' },
    { glyph: '↻', label: 'Redo' },
  ];

  const colorRoles = [
    { label: 'Desktop', token: '--w98-desktop-bg', hex: '#008080' },
    { label: 'Surface', token: '--w98-surface', hex: '#c0c0c0' },
    { label: 'Active Surface', token: '--w98-surface-active', hex: '#d4d0c8' },
    { label: 'Title Highlight', token: '--w98-highlight', hex: '#000080' },
    { label: 'Input White', token: '--w98-surface-white', hex: '#ffffff' },
    { label: 'Tooltip', token: '--w98-tooltip-bg', hex: '#ffffe1' },
    { label: 'Error', token: '--w98-color-error', hex: '#cc0000' },
    { label: 'Warning', token: '--w98-color-warning', hex: '#e8a000' },
  ];

  const auditTargets = [
    { label: 'Taskbar', detail: 'Start, tray, grip, active item, thin close' },
    { label: 'Windows', detail: 'Focused titlebar, unfocused titlebar, menu bar, resize shell' },
    { label: 'Desktop', detail: 'Shortcut tile, selected label, guide card, launch strip' },
    { label: 'Forms', detail: 'Buttons, fieldsets, input surfaces, dialog actions' },
    { label: 'Feedback', detail: 'Context menu, dialogs, toast chrome, drop overlay' },
    {
      label: 'Feature Surfaces',
      detail: 'Palette list, RetroCam capture shell',
    },
  ];

  const appliedUpdates = [
    'bitmap-first font stack',
    'shared control buttons',
    'taskbar spacing and close affordance',
    'dropzone card + note surface',
    'dialog, toast, context menu chrome',
    'message and help iconography alignment',
    'preview HUD readout chips',
    'crop overlay mini-dialog shell',
    'history panel list chrome',
    'palette list selection + pin state cleanup',
    'palette swatch bevel recipe',
    'compare slider + onion utility chrome',
    'preset thumbnail inset shell',
    'retrocam action/icon cleanup',
  ];

  const saveShortcut = buildShortcutLabel(['Primary', 'S']);
  const copyShortcut = buildShortcutLabel(['Primary', 'C']);
  const pasteHint = replacePrimaryModifierShortcutLabel('Ctrl+V to paste from clipboard.');
</script>

<svelte:head>
  <title>Retro Pixel Converter Design System</title>
</svelte:head>

<div class="ds-page">
  <header class="ds-header w98-floating-surface">
    <div class="ds-brand">
      <img src="/logo.png" alt="Retro Pixel Converter logo" class="ds-logo" />
      <div class="ds-brand-copy">
        <div class="ds-kicker">Retro Pixel Converter</div>
        <h1>Design System Audit Surface</h1>
        <p>Shell, typography, spacing, iconography, bevels, controls, feedback patterns.</p>
      </div>
    </div>
    <div class="ds-meta">
      <div><span class="mono">audit</span> retro-pixel-converter-design aligned</div>
      <div><span class="mono">desktop</span> teal shell</div>
      <div><span class="mono">type</span> bitmap-weight 11px base</div>
      <div><span class="mono">spacing</span> 2 / 4 / 6 / 8 / 12 / 16</div>
    </div>
  </header>

  <main class="ds-grid">
    <section class="ds-card w98-desktop-card" id="audit">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">🧭</span><span>Audit Targets</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="audit-grid">
          {#each auditTargets as item}
            <div class="audit-item w98-inset-panel">
              <div class="w98-section-title">{item.label}</div>
              <p class="w98-quiet-copy">{item.detail}</p>
            </div>
          {/each}
        </div>
        <div class="update-strip">
          {#each appliedUpdates as item}
            <div class="update-chip w98-chip">{item}</div>
          {/each}
        </div>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="identity">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">📌</span><span>Identity</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="identity-row">
          <div class="logo-panel w98-inset-panel">
            <img src="/logo.png" alt="Retro Pixel Converter logo specimen" class="logo-large" />
          </div>
          <div class="identity-copy">
            <div class="w98-section-title">Logo Rule</div>
            <p class="w98-quiet-copy">
              로고는 앱 아이콘과 시스템 정체성에만 사용하고, 제품 chrome 내부는 이모지 프로그램
              아이콘이 담당합니다.
            </p>
          </div>
        </div>
        <div class="icon-grid">
          {#each iconography as item}
            <div class="icon-cell w98-inset-panel">
              <span class="icon-cell-emoji w98-emoji">{item.emoji}</span>
              <span>{item.label}</span>
            </div>
          {/each}
        </div>
        <div class="structure-grid">
          {#each structuralIcons as item}
            <div class="icon-cell w98-inset-panel">
              <span class="icon-cell-emoji w98-structural-glyph">{item.glyph}</span>
              <span>{item.label}</span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="colors">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">🎛️</span><span>Color Structure</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="color-grid">
          {#each colorRoles as role}
            <div class="color-cell w98-inset-panel">
              <span class="color-swatch" style={`background:${role.hex}`}></span>
              <div class="color-meta">
                <span>{role.label}</span>
                <span class="mono">{role.token}</span>
                <span class="mono">{role.hex}</span>
              </div>
            </div>
          {/each}
        </div>
        <p class="w98-quiet-copy">
          UI chrome는 teal desktop, grey surface, navy highlight, white inset field의 네 축으로
          고정합니다. hover는 색을 바꾸지 않고 pressed 상태에서 bevel만 뒤집습니다.
        </p>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="type">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">🔤</span><span>Type Scale</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="type-list">
          {#each typeScale as item}
            <div class="type-row">
              <div class="type-meta">
                <span>{item.name}</span>
                <span class="mono">{item.token}</span>
              </div>
              <div class="type-sample" style={`font-size:${item.size}`}>{item.sample}</div>
              <div class="mono">{item.size}</div>
            </div>
          {/each}
        </div>
        <div class="specimen w98-inset-panel">
          <div class="specimen-title">Type Specimen</div>
          <p>Drop image here</p>
          <p>Load New Image...</p>
          <p>Pixel Lab - Controls</p>
          <p>{pasteHint}</p>
          <p class="mono">320×240 · 100% · 11px</p>
        </div>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="spacing">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">📏</span><span>Spacing And Bevels</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="spacing-list">
          {#each spacingScale as item}
            <div class="spacing-row">
              <span class="mono">{item.size}</span>
              <span class="spacing-bar"></span>
              <span>{item.use}</span>
            </div>
          {/each}
        </div>
        <div class="bevel-grid">
          <div class="bevel-swatch bevel-outset">outset</div>
          <div class="bevel-swatch bevel-inset">inset</div>
          <div class="bevel-swatch bevel-outset-thin">outset-thin</div>
          <div class="bevel-swatch bevel-inset-thin">inset-thin</div>
        </div>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="controls">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">🧰</span><span>Buttons, Form Fields</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="control-row">
          <button class="w98-button">OK</button>
          <button class="w98-button">Cancel</button>
          <button class="w98-button">Browse...</button>
          <button class="w98-button" disabled>Apply Now</button>
        </div>
        <div class="control-row">
          <button class="w98-button w98-button--primary"
            ><span class="w98-emoji">📂</span> Open Image</button
          >
          <button class="w98-button w98-button--primary"
            ><span class="w98-emoji">💾</span> Save As</button
          >
        </div>
        <div class="field-grid">
          <label class="field w98-form-stack">
            <span class="w98-form-label">Palette</span>
            <select class="w98-select">
              <option>Game Boy</option>
              <option>NES</option>
              <option>PICO-8</option>
            </select>
          </label>
          <label class="field w98-form-stack">
            <span class="w98-form-label">Scale</span>
            <input class="w98-range" type="range" min="1" max="10" value="4" />
          </label>
          <label class="field w98-form-stack">
            <span class="w98-form-label">Filename</span>
            <input class="w98-input" type="text" value="poster.png" />
          </label>
          <label class="field w98-form-stack">
            <span class="w98-form-label">Notes</span>
            <textarea class="w98-textarea" rows="3"
              >No rounded corners. No blur. No modern hover.</textarea
            >
          </label>
        </div>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="shell">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">🖥️</span><span>Desktop, Window, Taskbar</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="desktop-specimen">
          <div class="desktop-icons">
            <div class="desktop-icon w98-desktop-shortcut w98-desktop-shortcut--selected selected">
              <span class="w98-emoji w98-desktop-shortcut-icon">🖼️</span>
              <span class="w98-desktop-shortcut-label">Pixel Lab</span>
            </div>
            <div class="desktop-icon w98-desktop-shortcut">
              <span class="w98-emoji w98-desktop-shortcut-icon">📷</span>
              <span class="w98-desktop-shortcut-label">RetroCam</span>
            </div>
          </div>
          <div class="window specimen-window window">
            <div class="title-bar w98-shell-titlebar">
              <div class="title-bar-text w98-shell-title">
                <span class="w98-emoji">🖼️</span> Pixel Lab - Preview
              </div>
              <div class="title-bar-controls">
                <button type="button" class="w98-window-control-button" aria-label="Minimize"
                ></button>
                <button type="button" class="w98-window-control-button" aria-label="Maximize"
                ></button>
                <button type="button" class="w98-window-control-button" aria-label="Close"></button>
              </div>
            </div>
            <div class="window-body specimen-window-body">
              <div class="w98-inset-panel specimen-preview">320×240 Preview</div>
              <div class="specimen-status">
                <span><span class="w98-emoji">🎨</span> Game Boy</span>
                <span><span class="w98-emoji">📌</span> 4px</span>
                <span><span class="w98-emoji">💾</span> PNG</span>
              </div>
            </div>
          </div>
          <div class="taskbar-specimen">
            <button type="button" class="start-btn w98-taskbar-button"
              ><span class="w98-structural-glyph">⊞</span><span>Start</span></button
            >
            <span class="w98-taskbar-grip"></span>
            <div class="task-item w98-taskbar-button w98-taskbar-button--active active">
              <span class="w98-emoji">🖼️</span><span>Pixel Lab</span>
            </div>
            <div class="task-item w98-taskbar-button">
              <span class="w98-emoji">⚙️</span><span>Controls</span>
            </div>
            <div class="tray w98-taskbar-tray">
              <span class="w98-emoji">🔊</span><span>11:24 AM</span>
            </div>
          </div>
          <div class="start-launcher-specimen w98-menu-surface">
            <div class="w98-start-menu-banner">Retro Pixel</div>
            <div class="start-launcher-items">
              <button class="menu-item w98-menu-item ctx-heading" disabled
                ><span class="w98-structural-glyph">⊞</span><span>Programs</span></button
              >
              <button class="menu-item w98-menu-item"
                ><span class="w98-emoji">🖼️</span><span>Open Pixel Lab</span></button
              >

              <div class="menu-sep w98-menu-divider"></div>
              <button class="menu-item w98-menu-item ctx-heading" disabled
                ><span class="w98-emoji">📂</span><span>Recent Projects</span></button
              >
              <button class="menu-item w98-menu-item"
                ><span class="w98-emoji">📷</span><span>RetroCam Capture</span></button
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ds-card w98-desktop-card" id="feedback">
      <div class="w98-window-card-titlebar">
        <div class="w98-window-card-title">
          <span class="w98-emoji">💬</span><span>Dialogs, Toasts, Context Menu</span>
        </div>
      </div>
      <div class="w98-window-card-body">
        <div class="feedback-grid">
          <div class="context-menu w98-menu-surface">
            <button class="menu-item w98-menu-item"
              ><span class="w98-emoji">💾</span><span>Save</span><span class="w98-menu-shortcut"
                >{saveShortcut}</span
              ></button
            >
            <button class="menu-item w98-menu-item active"
              ><span class="w98-emoji">📋</span><span>Copy</span><span class="w98-menu-shortcut"
                >{copyShortcut}</span
              ></button
            >
            <button class="menu-item w98-menu-item"
              ><span class="w98-emoji">🔀</span><span>Compare</span></button
            >
          </div>
          <div class="dialog-stack">
            <div class="window toast-dialog">
              <div class="title-bar w98-shell-titlebar">
                <div class="title-bar-text w98-shell-title">
                  <span class="w98-emoji">ℹ️</span> Desktop Notice
                </div>
                <div class="title-bar-controls">
                  <button type="button" class="w98-window-control-button" aria-label="Close"
                  ></button>
                </div>
              </div>
              <div class="window-body toast-dialog-body">
                <div class="dialog-message-row">
                  <span class="dialog-message-icon w98-emoji">⚠️</span>
                  <span>Image resized from 4096×4096 to 2048×2048px.</span>
                </div>
                <div class="dialog-actions"><button class="w98-button">OK</button></div>
              </div>
            </div>
            <div class="toast-row">
              <div class="toast-specimen w98-floating-surface">
                <span class="w98-emoji">ℹ️</span><span>Saved poster.png</span>
              </div>
              <div class="toast-specimen w98-floating-surface">
                <span class="w98-emoji">💡</span><span>Image resized. Undo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>

<style>
  .ds-page {
    min-height: 100vh;
    padding: var(--w98-space-16);
    background: var(--w98-desktop-bg);
    box-sizing: border-box;
    overflow: auto;
  }

  .ds-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: var(--w98-space-16);
    padding: var(--w98-space-12) var(--w98-space-16);
    margin-bottom: var(--w98-space-16);
  }

  .ds-brand {
    display: flex;
    align-items: center;
    gap: var(--w98-space-12);
    min-width: 0;
  }

  .ds-logo {
    width: 48px;
    height: 48px;
    image-rendering: pixelated;
    flex-shrink: 0;
  }

  .ds-brand-copy {
    min-width: 0;
  }

  .ds-brand-copy h1 {
    margin: 0 0 var(--w98-space-4);
    font-size: var(--w98-font-size-heading);
  }

  .ds-brand-copy p,
  .ds-meta {
    margin: 0;
    color: var(--w98-text-secondary);
    line-height: 1.35;
  }

  .ds-kicker,
  .specimen-title {
    font-size: var(--w98-font-size-caption);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--w98-text-hint);
  }

  .mono {
    font-family: 'Courier New', Courier, monospace;
  }

  .ds-meta {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-4);
    justify-content: center;
    min-width: 200px;
  }

  .ds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--w98-space-16);
  }

  .ds-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .identity-row,
  .feedback-grid {
    display: grid;
    grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
    gap: var(--w98-space-12);
    align-items: start;
  }

  .logo-panel,
  .specimen-preview {
    display: grid;
    place-items: center;
    min-height: 108px;
    padding: var(--w98-space-12);
  }

  .logo-large {
    width: 72px;
    height: 72px;
    image-rendering: pixelated;
  }

  .icon-grid,
  .structure-grid,
  .color-grid,
  .bevel-grid,
  .audit-grid,
  .field-grid,
  .toast-row {
    display: grid;
    gap: var(--w98-space-8);
  }

  .update-strip {
    display: flex;
    flex-wrap: wrap;
    gap: var(--w98-space-8);
  }

  .update-chip {
    min-height: 20px;
  }

  .icon-grid {
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  }

  .structure-grid,
  .audit-grid,
  .color-grid {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .audit-item {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
    min-height: 84px;
    padding: var(--w98-space-8) var(--w98-space-8) var(--w98-space-12);
  }

  .icon-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--w98-space-6);
    padding: var(--w98-space-8) var(--w98-space-8) var(--w98-space-12);
    text-align: center;
    min-height: 72px;
  }

  .icon-cell-emoji {
    font-size: 22px;
  }

  .color-cell {
    display: flex;
    align-items: center;
    gap: var(--w98-space-8);
    min-height: 64px;
    padding: var(--w98-space-8);
  }

  .color-swatch {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    box-shadow: var(--w98-outset-thin);
  }

  .color-meta {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-2);
    min-width: 0;
  }

  .type-list,
  .spacing-list {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-6);
  }

  .type-row,
  .spacing-row {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr) 64px;
    gap: var(--w98-space-12);
    align-items: center;
  }

  .type-meta {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-2);
  }

  .type-meta .mono,
  .specimen .mono {
    font-size: var(--w98-font-size-caption);
    color: var(--w98-text-hint);
  }

  .specimen {
    padding: var(--w98-space-8) var(--w98-space-12);
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-4);
  }

  .spacing-bar {
    height: 14px;
    background: var(--w98-highlight);
    box-shadow: var(--w98-outset-thin);
  }

  .bevel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bevel-swatch {
    min-height: 48px;
    display: grid;
    place-items: center;
    background: var(--w98-surface);
  }

  .bevel-outset {
    box-shadow: var(--w98-outset);
  }

  .bevel-inset {
    box-shadow: var(--w98-inset);
  }

  .bevel-outset-thin {
    box-shadow: var(--w98-outset-thin);
  }

  .bevel-inset-thin {
    box-shadow: var(--w98-inset-thin);
  }

  .control-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--w98-space-8);
  }

  .field-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-4);
  }

  .field input[type='text'],
  .field select,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
  }

  .desktop-specimen {
    position: relative;
    min-height: 260px;
    padding: var(--w98-space-12);
    background: var(--w98-desktop-bg);
    box-shadow: var(--w98-inset);
    overflow: hidden;
  }

  .desktop-icons {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-8);
    width: 72px;
  }

  .desktop-icon {
    width: 68px;
  }

  .desktop-icon.selected {
    outline-offset: -1px;
  }

  .specimen-window {
    position: absolute;
    top: 18px;
    left: 96px;
    width: min(100%, 300px);
  }

  .specimen-window-body {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-8);
  }

  .specimen-preview {
    min-height: 96px;
  }

  .specimen-status {
    display: flex;
    flex-wrap: wrap;
    gap: var(--w98-space-8);
  }

  .taskbar-specimen {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--w98-taskbar-height);
    display: flex;
    align-items: center;
    gap: var(--w98-space-4);
    padding: var(--w98-space-2);
    background: var(--w98-surface);
    box-shadow: var(--w98-outset);
  }

  .taskbar-specimen .start-btn,
  .taskbar-specimen .task-item,
  .taskbar-specimen .tray {
    min-height: calc(var(--w98-taskbar-height) - 4px);
    display: inline-flex;
    align-items: center;
    gap: var(--w98-space-4);
    padding: 0 var(--w98-space-8);
  }

  .taskbar-specimen .tray {
    margin-left: auto;
  }

  .start-launcher-specimen {
    position: absolute;
    left: var(--w98-space-4);
    bottom: calc(var(--w98-taskbar-height) + var(--w98-space-4));
    display: flex;
    align-items: stretch;
    gap: var(--w98-space-2);
    min-width: 180px;
    max-width: 220px;
    padding-left: 0;
  }

  .start-launcher-items {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .context-menu {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .menu-item {
    text-align: left;
  }

  .menu-item.active {
    background: var(--w98-highlight);
    color: #fff;
  }

  .dialog-stack {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-12);
  }

  .toast-dialog-body {
    display: flex;
    flex-direction: column;
    gap: var(--w98-space-12);
  }

  .dialog-message-row {
    display: flex;
    align-items: flex-start;
    gap: var(--w98-space-8);
  }

  .dialog-message-icon {
    font-size: 22px;
    line-height: 1;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }

  .toast-row {
    grid-template-columns: 1fr;
  }

  .toast-specimen {
    display: flex;
    align-items: center;
    gap: var(--w98-space-8);
    padding: var(--w98-space-8) var(--w98-space-12);
  }

  @media (max-width: 900px) {
    .ds-header,
    .identity-row,
    .feedback-grid {
      grid-template-columns: 1fr;
      display: grid;
    }

    .ds-header {
      display: flex;
      flex-direction: column;
    }
  }
</style>
