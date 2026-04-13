export type RetroCamPermissionState =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'busy'
  | 'unsupported'
  | 'error';

export type RetroCamPresetId = 'clean_pixel' | 'crt_pop' | 'game_boy' | 'warm_poster';

export interface RetroCamPreset {
  id: RetroCamPresetId;
  labelKey: 'retrocam_preset_clean_pixel' | 'retrocam_preset_crt_pop' | 'retrocam_preset_game_boy' | 'retrocam_preset_warm_poster';
  filter: string;
}

export interface MediaDevicesLike {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
}

export const RETROCAM_PRESETS: RetroCamPreset[] = [
  { id: 'clean_pixel', labelKey: 'retrocam_preset_clean_pixel', filter: 'contrast(1.08) saturate(1.05)' },
  { id: 'crt_pop', labelKey: 'retrocam_preset_crt_pop', filter: 'contrast(1.18) saturate(1.15) hue-rotate(-6deg)' },
  { id: 'game_boy', labelKey: 'retrocam_preset_game_boy', filter: 'grayscale(1) sepia(0.45) hue-rotate(40deg) saturate(2.4)' },
  { id: 'warm_poster', labelKey: 'retrocam_preset_warm_poster', filter: 'sepia(0.22) saturate(1.3) contrast(1.05) brightness(1.02)' },
];

function detectMediaDevices(override?: MediaDevicesLike | null): MediaDevicesLike | null {
  if (override !== undefined) return override;
  if (typeof navigator === 'undefined') return null;
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') return null;
  return navigator.mediaDevices;
}

function revokeObjectUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function createRetroCamStore(mediaDevicesOverride?: MediaDevicesLike | null) {
  let permissionState = $state<RetroCamPermissionState>('idle');
  let stream = $state<MediaStream | null>(null);
  let activePresetId = $state<RetroCamPresetId>('clean_pixel');
  let lastSnapshotUrl = $state<string | null>(null);
  let lastSnapshotFile = $state<File | null>(null);

  function stopCamera() {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    stream = null;
  }

  async function requestCamera() {
    stopCamera();
    permissionState = 'requesting';

    const mediaDevices = detectMediaDevices(mediaDevicesOverride);
    if (!mediaDevices) {
      permissionState = 'unsupported';
      return null;
    }

    try {
      const nextStream = await mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      stream = nextStream;
      permissionState = 'ready';
      return nextStream;
    } catch (error) {
      const err = error as DOMException | Error;
      switch (err.name) {
        case 'NotAllowedError':
        case 'SecurityError':
          permissionState = 'denied';
          break;
        case 'NotFoundError':
        case 'OverconstrainedError':
          permissionState = 'unavailable';
          break;
        case 'NotReadableError':
        case 'AbortError':
        case 'TrackStartError':
          permissionState = 'busy';
          break;
        default:
          permissionState = 'error';
          break;
      }
      return null;
    }
  }

  function setPreset(nextPresetId: RetroCamPresetId) {
    activePresetId = nextPresetId;
  }

  function setSnapshot(file: File, nextUrl: string) {
    revokeObjectUrl(lastSnapshotUrl);
    lastSnapshotFile = file;
    lastSnapshotUrl = nextUrl;
  }

  function clearSnapshot() {
    revokeObjectUrl(lastSnapshotUrl);
    lastSnapshotUrl = null;
    lastSnapshotFile = null;
  }

  function destroy() {
    stopCamera();
    clearSnapshot();
    permissionState = 'idle';
  }

  return {
    get permissionState() {
      return permissionState;
    },
    get stream() {
      return stream;
    },
    get activePresetId() {
      return activePresetId;
    },
    get lastSnapshotUrl() {
      return lastSnapshotUrl;
    },
    get lastSnapshotFile() {
      return lastSnapshotFile;
    },
    requestCamera,
    stopCamera,
    setPreset,
    setSnapshot,
    clearSnapshot,
    destroy,
  };
}

export let retroCamStore = createRetroCamStore();

export function resetRetroCamStore(mediaDevicesOverride?: MediaDevicesLike | null) {
  retroCamStore.destroy();
  retroCamStore = createRetroCamStore(mediaDevicesOverride);
  return retroCamStore;
}
