/**
 * Worker Pool for parallel image processing.
 * Spawns N image workers and distributes tasks across them.
 * Used for batch operations like GIF frame processing.
 */
import type { ImageWorkerMessage, ImageWorkerResponse } from '../types';

interface PoolTask {
  message: ImageWorkerMessage;
  transfer: Transferable[];
  resolve: (data: ImageData) => void;
  reject: (error: Error) => void;
}

export class ImageWorkerPool {
  private workers: Worker[] = [];
  private busy = new Set<number>();
  private queue: PoolTask[] = [];

  constructor(size?: number) {
    const poolSize = Math.max(1, Math.min(
      size ?? (navigator.hardwareConcurrency || 4),
      8,
    ));
    for (let i = 0; i < poolSize; i++) {
      this.workers.push(
        new Worker(
          new URL('../workers/imageWorker.ts', import.meta.url),
          { type: 'module' },
        ),
      );
    }
  }

  private dispatch(idx: number, task: PoolTask) {
    this.busy.add(idx);
    const worker = this.workers[idx];
    const ac = new AbortController();
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      ac.abort();
      this.busy.delete(idx);
      // Pick up next queued task
      if (this.queue.length > 0) {
        this.dispatch(idx, this.queue.shift()!);
      }
    };

    worker.addEventListener('message', (e: MessageEvent<ImageWorkerResponse>) => {
      // Skip progress messages — only handle completion
      if (e.data.type === 'progress') return;
      cleanup();
      if (e.data.error) {
        task.reject(new Error(e.data.error));
      } else {
        task.resolve(new ImageData(
          new Uint8ClampedArray(e.data.processedData.data),
          e.data.processedData.width,
          e.data.processedData.height,
        ));
      }
    }, { signal: ac.signal });

    worker.addEventListener('error', (err) => {
      cleanup();
      task.reject(new Error(err.message || `Worker ${idx} error`));
    }, { signal: ac.signal });

    worker.postMessage(task.message, task.transfer);
  }

  /** Submit a single frame for processing. Returns the processed ImageData. */
  submit(message: ImageWorkerMessage, transfer: Transferable[]): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const task: PoolTask = { message, transfer, resolve, reject };
      // Find a free worker
      for (let i = 0; i < this.workers.length; i++) {
        if (!this.busy.has(i)) {
          this.dispatch(i, task);
          return;
        }
      }
      // All busy — queue it
      this.queue.push(task);
    });
  }

  /** Terminate all workers and reject pending tasks. */
  destroy() {
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.busy.clear();
    for (const task of this.queue) {
      task.reject(new Error('Pool destroyed'));
    }
    this.queue = [];
  }
}
