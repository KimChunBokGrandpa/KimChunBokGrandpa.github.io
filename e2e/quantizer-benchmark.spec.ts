import { expect, test } from 'playwright/test';

const shouldRun = process.env.QUANTIZER_RUNTIME_BENCH === '1';

test.skip(!shouldRun, 'runtime benchmark runs only when explicitly requested');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('retro-pixel-locale', 'en');
    localStorage.setItem('retropixel_onboarding_dismissed', '1');
  });
});

test('captures browser quantizer runtime matrix snapshot', async ({ page }) => {
  await page.goto('/');

  const snapshot = await page.evaluate(async () => {
    const { benchmarkQuantizationMatrix, formatQuantizerBenchmarkTable } = await import('/src/lib/utils/quantizerBenchmark.ts');

    const rows = await benchmarkQuantizationMatrix([
      {
        label: 'JS Ordered',
        width: 192,
        height: 192,
        pixelSize: 3,
        iterations: 4,
        palette: 'win256',
        ditherType: 'ordered',
        backend: 'js',
      },
      {
        label: 'JS Ordered + Oklab',
        width: 192,
        height: 192,
        pixelSize: 3,
        iterations: 4,
        palette: 'win256',
        ditherType: 'ordered',
        backend: 'js',
        useOklab: true,
      },
      {
        label: 'WASM Ordered',
        width: 192,
        height: 192,
        pixelSize: 3,
        iterations: 4,
        palette: 'win256',
        ditherType: 'ordered',
        backend: 'wasm',
      },
      {
        label: 'WASM Ordered + Oklab',
        width: 192,
        height: 192,
        pixelSize: 3,
        iterations: 4,
        palette: 'win256',
        ditherType: 'ordered',
        backend: 'wasm',
        useOklab: true,
      },
      {
        label: 'WASM Atkinson',
        width: 192,
        height: 192,
        pixelSize: 3,
        iterations: 4,
        palette: 'win256',
        ditherType: 'atkinson',
        backend: 'wasm',
      },
    ]);

    return {
      rows,
      table: formatQuantizerBenchmarkTable(rows),
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    };
  });

  console.log('\nQuantizer runtime snapshot');
  console.log(`UA: ${snapshot.userAgent}`);
  console.log(`HW threads: ${snapshot.hardwareConcurrency ?? 'unknown'}`);
  console.log(snapshot.table);

  expect(snapshot.rows).toHaveLength(5);

  for (const row of snapshot.rows) {
    expect(row.avgMs).toBeGreaterThanOrEqual(0);
  }

  for (const row of snapshot.rows.filter((entry) => entry.requestedBackend === 'wasm')) {
    expect(row.actualBackend).toBe('wasm');
    expect(row.fallbackReason).toBeUndefined();
  }
});
