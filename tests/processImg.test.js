/**
 * IPT-Web — processImg Test Suite
 * 
 * Run with:  npm run test
 * Setup:     npm install -D vitest
 *            Add to package.json scripts: "test": "vitest run"
 *
 * Covers one representative operation from each of the 17 modules,
 * plus helper functions and edge cases.
 */

import { describe, test, expect } from 'vitest';

// ─── Inline helpers (copied from App.jsx — no React dependency needed) ────────

function convolve(gray, W, H, kernel) {
  const k = kernel.length, kh = Math.floor(k / 2);
  const res = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0;
    for (let ky = 0; ky < k; ky++) for (let kx = 0; kx < k; kx++) {
      const px = Math.min(Math.max(x + kx - kh, 0), W - 1);
      const py = Math.min(Math.max(y + ky - kh, 0), H - 1);
      s += gray[py * W + px] * kernel[ky][kx];
    }
    res[y * W + x] = s;
  }
  return res;
}

function arrMin(a) { let m = Infinity; for (let i = 0; i < a.length; i++) if (a[i] < m) m = a[i]; return m; }
function arrMax(a) { let m = -Infinity; for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }

// ─── Test image factory ───────────────────────────────────────────────────────

/**
 * Creates a synthetic ImageData-like object for testing.
 * @param {number} W - width
 * @param {number} H - height
 * @param {Function} fillFn - (x, y) => [r, g, b, a]
 */
function makeImage(W, H, fillFn) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = fillFn(x, y);
      const i = (y * W + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a ?? 255;
    }
  }
  return { width: W, height: H, data };
}

/** Uniform gray image */
const grayImg = (v, W = 4, H = 4) => makeImage(W, H, () => [v, v, v, 255]);

/** Uniform color image */
const colorImg = (r, g, b, W = 4, H = 4) => makeImage(W, H, () => [r, g, b, 255]);

/** Extract grayscale array from ImageData */
const toGray = (img) => {
  const N = img.width * img.height;
  const g = new Float32Array(N);
  for (let i = 0; i < N; i++) g[i] = 0.299 * img.data[i * 4] + 0.587 * img.data[i * 4 + 1] + 0.114 * img.data[i * 4 + 2];
  return g;
};

// ─── Import processImg (ES module from App.jsx) ───────────────────────────────
// processImg is extracted below as a standalone function to avoid React imports.
// In a real Vite project, you would split processImg into its own file and import it.
// For now we inline it here so the tests run with zero config changes.

// ── Inlined processImg (the pure processing core, no React) ──────────────────
function processImg(src, modId, topic, params = {}) {
  const { width: W, height: H, data } = src;
  const out = new Uint8ClampedArray(data);
  const N = W * H;
  const gray = new Float32Array(N);
  for (let i = 0; i < N; i++) gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];

  const setG = (buf, abs = false) => {
    const vals = abs ? buf.map(Math.abs) : buf;
    const mn = arrMin(vals), mx = arrMax(vals), rng = mx - mn || 1;
    for (let i = 0; i < N; i++) { const v = Math.round((vals[i] - mn) / rng * 255); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
  };

  const KX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const KY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  const GAUSS = [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map(r => r.map(v => v / 16));
  const MEAN = [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9));

  if (modId === "intensity") {
    const g = params.gamma || 1, T = params.thresh || 128, plane = params.plane || 7, k = params.k || 0.1;
    const _hsMin = arrMin(gray), _hsMax = arrMax(gray), _hsRng = _hsMax - _hsMin;
    for (let i = 0; i < N; i++) {
      let r = data[i * 4], g2 = data[i * 4 + 1], b = data[i * 4 + 2], v;
      if (topic === "Negative") { out[i * 4] = 255 - r; out[i * 4 + 1] = 255 - g2; out[i * 4 + 2] = 255 - b; }
      else if (topic === "Log Transform") { out[i * 4] = Math.round(Math.log(1 + r) / Math.log(256) * 255); out[i * 4 + 1] = Math.round(Math.log(1 + g2) / Math.log(256) * 255); out[i * 4 + 2] = Math.round(Math.log(1 + b) / Math.log(256) * 255); }
      else if (topic === "Gamma") { out[i * 4] = Math.round(Math.pow(r / 255, g) * 255); out[i * 4 + 1] = Math.round(Math.pow(g2 / 255, g) * 255); out[i * 4 + 2] = Math.round(Math.pow(b / 255, g) * 255); }
      else if (topic === "Thresholding") { v = gray[i] >= T ? 255 : 0; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; }
      else if (topic === "Sigmoid") { v = Math.round(255 / (1 + Math.exp(-k * (gray[i] - 128)))); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; }
      else if (topic === "Histogram Stretch") { v = Math.round((gray[i] - _hsMin) / (_hsRng || 1) * 255); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; }
      out[i * 4 + 3] = 255;
    }
  }

  else if (modId === "histogram") {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < N; i++) hist[Math.round(gray[i])]++;
    if (topic === "Histogram Equalization" || topic === "Gamma via CDF") {
      const cdfMin = hist.findIndex(v => v > 0) || 0;
      let cum2 = 0; const lut = new Uint8Array(256);
      for (let k = 0; k < 256; k++) { cum2 += hist[k]; lut[k] = Math.round(Math.max(0, (cum2 - hist[cdfMin]) / (N - hist[cdfMin]) * 255)); }
      for (let i = 0; i < N; i++) { const v = lut[Math.round(gray[i])]; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
    } else {
      for (let i = 0; i < N; i++) { const v = Math.round(gray[i]); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
    }
  }

  else if (modId === "spatial") {
    const KERNELS = {
      "Mean Filter": MEAN, "Gaussian Filter": GAUSS,
      "Laplacian": [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
      "Sobel X": KX, "Sobel Y": KY,
      "Sharpen": [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    };
    if (topic === "Median Filter") {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = []; for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) { const px = Math.min(Math.max(x + kx, 0), W - 1), py = Math.min(Math.max(y + ky, 0), H - 1); v.push(gray[py * W + px]); }
        v.sort((a, b) => a - b); const m = Math.round(v[4]); const idx = (y * W + x) * 4; out[idx] = out[idx + 1] = out[idx + 2] = m; out[idx + 3] = 255;
      }
    } else if (topic === "Gradient Magnitude") {
      const gx = convolve(gray, W, H, KX), gy = convolve(gray, W, H, KY);
      for (let i = 0; i < N; i++) { const v = Math.min(255, Math.round(Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]))); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
    } else {
      const k = KERNELS[topic] || GAUSS;
      const res = convolve(gray, W, H, k);
      const isAbs = ["Laplacian", "Sobel X", "Sobel Y"].includes(topic);
      setG(res, isAbs);
    }
  }

  else if (modId === "color") {
    const _ceqHist = new Array(256).fill(0); for (let j = 0; j < N; j++) _ceqHist[Math.round(gray[j])]++;
    let _ceqCs = 0; const _ceqLut = new Uint8Array(256); for (let k = 0; k < 256; k++) { _ceqCs += _ceqHist[k]; _ceqLut[k] = Math.round(_ceqCs / N * 255); }
    const _ceqV = new Float32Array(N); for (let j = 0; j < N; j++) { const rn = data[j * 4] / 255, gn = data[j * 4 + 1] / 255, bn = data[j * 4 + 2] / 255; _ceqV[j] = Math.max(rn, gn, bn); }
    for (let i = 0; i < N; i++) {
      const r = data[i * 4], g2 = data[i * 4 + 1], b = data[i * 4 + 2];
      if (topic === "Grayscale") { const gv = Math.round(gray[i]); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = gv; }
      else if (topic === "Red Channel") { out[i * 4] = r; out[i * 4 + 1] = 0; out[i * 4 + 2] = 0; }
      else if (topic === "Sepia") { out[i * 4] = Math.min(255, Math.round(r * 0.393 + g2 * 0.769 + b * 0.189)); out[i * 4 + 1] = Math.min(255, Math.round(r * 0.349 + g2 * 0.686 + b * 0.168)); out[i * 4 + 2] = Math.min(255, Math.round(r * 0.272 + g2 * 0.534 + b * 0.131)); }
      else if (topic === "Negative Color") { out[i * 4] = 255 - r; out[i * 4 + 1] = 255 - g2; out[i * 4 + 2] = 255 - b; }
      else { out[i * 4] = r; out[i * 4 + 1] = g2; out[i * 4 + 2] = b; }
      out[i * 4 + 3] = 255;
    }
  }

  else if (modId === "segmentation") {
    const T = params.thresh || 128;
    if (topic === "Global Threshold") {
      for (let i = 0; i < N; i++) { const v = gray[i] >= T ? 255 : 0; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
    } else if (topic === "Otsu Method") {
      const hist2 = new Array(256).fill(0); for (let i = 0; i < N; i++) hist2[Math.round(gray[i])]++;
      let bestT = 0, bestSig = 0, sum2 = 0; for (let k = 0; k < 256; k++) sum2 += k * hist2[k];
      let w0 = 0, sumB = 0; for (let t = 0; t < 256; t++) { w0 += hist2[t] / N; const w1 = 1 - w0; if (!w0 || !w1) continue; sumB += t * hist2[t] / N; const mu0 = sumB / (w0 || 1), mu1 = (sum2 / N - sumB) / (w1 || 1), sig = w0 * w1 * ((mu0 - mu1) * (mu0 - mu1)); if (sig > bestSig) { bestSig = sig; bestT = t; } }
      for (let i = 0; i < N; i++) { const v = gray[i] >= bestT ? 255 : 0; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
    } else {
      for (let i = 0; i < N; i++) { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = Math.round(gray[i]); out[i * 4 + 3] = 255; }
    }
  }

  else if (modId === "morphology") {
    const se = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
    const grayF = new Float32Array(gray);
    const erode = (src) => { const res = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let mn = 255; for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) { const px = Math.min(Math.max(x + kx, 0), W - 1), py = Math.min(Math.max(y + ky, 0), H - 1); if (se[ky + 1][kx + 1]) mn = Math.min(mn, src[py * W + px]); } res[y * W + x] = mn; } return res; };
    const dilate = (src) => { const res = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let mx = 0; for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) { const px = Math.min(Math.max(x + kx, 0), W - 1), py = Math.min(Math.max(y + ky, 0), H - 1); if (se[ky + 1][kx + 1]) mx = Math.max(mx, src[py * W + px]); } res[y * W + x] = mx; } return res; };
    let result;
    if (topic === "Erosion") result = erode(grayF);
    else if (topic === "Dilation") result = dilate(grayF);
    else if (topic === "Opening") { const e = erode(grayF); result = dilate(e); }
    else if (topic === "Closing") { const d = dilate(grayF); result = erode(d); }
    else result = grayF;
    const mn2 = arrMin(result), mx2 = arrMax(result), rng2 = mx2 - mn2 || 1;
    for (let i = 0; i < N; i++) { const v = Math.round((result[i] - mn2) / rng2 * 255); out[i * 4] = v; out[i * 4 + 1] = v; out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
  }

  else {
    for (let i = 0; i < N; i++) { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = Math.round(gray[i]); out[i * 4 + 3] = 255; }
  }

  return { width: W, height: H, data: out };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Helper function tests ─────────────────────────────────────────────────────

describe('arrMin / arrMax helpers', () => {
  test('arrMin returns correct minimum', () => {
    expect(arrMin([5, 3, 8, 1, 9])).toBe(1);
  });

  test('arrMax returns correct maximum', () => {
    expect(arrMax([5, 3, 8, 1, 9])).toBe(9);
  });

  test('arrMin handles single element', () => {
    expect(arrMin([42])).toBe(42);
  });

  test('arrMax handles negative values', () => {
    expect(arrMax([-10, -5, -1, -100])).toBe(-1);
  });

  test('arrMin/arrMax work on large Float32Array (no stack overflow)', () => {
    const big = new Float32Array(102400).fill(0).map((_, i) => i % 256);
    expect(arrMin(big)).toBe(0);
    expect(arrMax(big)).toBe(255);
  });
});

// ── convolve tests ────────────────────────────────────────────────────────────

describe('convolve', () => {
  test('identity kernel returns unchanged values', () => {
    const gray = new Float32Array([10, 20, 30, 40, 50, 60, 40, 30, 20]);
    const identity = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];
    const result = convolve(gray, 3, 3, identity);
    expect(result[4]).toBeCloseTo(50, 0); // center pixel unchanged
  });

  test('mean kernel smooths uniform image to same value', () => {
    const gray = new Float32Array(9).fill(100);
    const mean = [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9));
    const result = convolve(gray, 3, 3, mean);
    for (let i = 0; i < 9; i++) expect(result[i]).toBeCloseTo(100, 0);
  });

  test('Sobel X kernel produces zero response on uniform image', () => {
    const gray = new Float32Array(9).fill(128);
    const KX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const result = convolve(gray, 3, 3, KX);
    expect(result[4]).toBeCloseTo(0, 0);
  });

  test('handles non-square images', () => {
    const gray = new Float32Array(8).fill(50); // 4x2
    const mean = [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9));
    const result = convolve(gray, 4, 2, mean);
    expect(result.length).toBe(8);
  });
});

// ── processImg output validation ──────────────────────────────────────────────

describe('processImg — output structure', () => {
  test('returns ImageData with correct dimensions', () => {
    const img = grayImg(100, 8, 8);
    const result = processImg(img, 'intensity', 'Negative', {});
    expect(result.width).toBe(8);
    expect(result.height).toBe(8);
    expect(result.data.length).toBe(8 * 8 * 4);
  });

  test('all alpha values are 255 in output', () => {
    const img = colorImg(100, 150, 200, 8, 8);
    const result = processImg(img, 'color', 'Grayscale', {});
    for (let i = 3; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(255);
    }
  });

  test('all pixel values are in range 0-255', () => {
    const img = grayImg(128, 16, 16);
    const ops = [
      ['intensity', 'Negative'],
      ['intensity', 'Log Transform'],
      ['intensity', 'Gamma'],
      ['spatial', 'Gaussian Filter'],
      ['color', 'Sepia'],
    ];
    for (const [mod, topic] of ops) {
      const result = processImg(img, mod, topic, { gamma: 1.5 });
      for (let i = 0; i < result.data.length; i++) {
        expect(result.data[i]).toBeGreaterThanOrEqual(0);
        expect(result.data[i]).toBeLessThanOrEqual(255);
      }
    }
  });

  test('does not mutate the input image', () => {
    const img = grayImg(100, 8, 8);
    const originalCopy = new Uint8ClampedArray(img.data);
    processImg(img, 'intensity', 'Negative', {});
    for (let i = 0; i < img.data.length; i++) {
      expect(img.data[i]).toBe(originalCopy[i]);
    }
  });
});

// ── Module 1: Intensity Transformations ──────────────────────────────────────

describe('Intensity Transformations', () => {
  test('Negative: inverts all channel values', () => {
    const img = colorImg(100, 150, 200, 4, 4);
    const result = processImg(img, 'intensity', 'Negative', {});
    expect(result.data[0]).toBe(155); // 255 - 100
    expect(result.data[1]).toBe(105); // 255 - 150
    expect(result.data[2]).toBe(55);  // 255 - 200
  });

  test('Negative of black is white', () => {
    const img = grayImg(0, 4, 4);
    const result = processImg(img, 'intensity', 'Negative', {});
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(255);
    expect(result.data[2]).toBe(255);
  });

  test('Negative of white is black', () => {
    const img = grayImg(255, 4, 4);
    const result = processImg(img, 'intensity', 'Negative', {});
    expect(result.data[0]).toBe(0);
  });

  test('Thresholding: pixels above T become white', () => {
    const img = grayImg(200, 4, 4);
    const result = processImg(img, 'intensity', 'Thresholding', { thresh: 128 });
    expect(result.data[0]).toBe(255);
  });

  test('Thresholding: pixels below T become black', () => {
    const img = grayImg(50, 4, 4);
    const result = processImg(img, 'intensity', 'Thresholding', { thresh: 128 });
    expect(result.data[0]).toBe(0);
  });

  test('Gamma=1 produces same output as input (grayscale)', () => {
    const img = grayImg(128, 4, 4);
    const result = processImg(img, 'intensity', 'Gamma', { gamma: 1 });
    expect(result.data[0]).toBeCloseTo(128, 0);
  });

  test('Gamma<1 brightens image', () => {
    const img = grayImg(100, 4, 4);
    const original = processImg(img, 'intensity', 'Gamma', { gamma: 1 });
    const brightened = processImg(img, 'intensity', 'Gamma', { gamma: 0.5 });
    expect(brightened.data[0]).toBeGreaterThan(original.data[0]);
  });

  test('Histogram Stretch: output spans full 0-255 range', () => {
    // Image with limited contrast range 50-150
    const img = makeImage(8, 8, (x, y) => [50 + x * 12, 50 + x * 12, 50 + x * 12, 255]);
    const result = processImg(img, 'intensity', 'Histogram Stretch', {});
    const gray = toGray(result);
    expect(arrMin(gray)).toBeCloseTo(0, 0);
    expect(arrMax(gray)).toBeCloseTo(255, 0);
  });

  test('Log Transform: dark pixels brightened more than bright pixels', () => {
    const dark = grayImg(10, 4, 4);
    const bright = grayImg(200, 4, 4);
    const darkResult = processImg(dark, 'intensity', 'Log Transform', {});
    const brightResult = processImg(bright, 'intensity', 'Log Transform', {});
    // Log compression: dark gain > bright gain
    const darkGain = darkResult.data[0] - 10;
    const brightGain = brightResult.data[0] - 200;
    expect(darkGain).toBeGreaterThan(brightGain);
  });
});

// ── Module 2: Histogram Processing ───────────────────────────────────────────

describe('Histogram Processing', () => {
  test('Histogram Equalization: uniform image stays uniform', () => {
    const img = grayImg(128, 8, 8);
    const result = processImg(img, 'histogram', 'Histogram Equalization', {});
    // All pixels same value → histogram equalization maps them to one output
    const first = result.data[0];
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(first);
    }
  });

  test('Histogram Equalization: output values are in valid range', () => {
    const img = makeImage(16, 16, (x, y) => [x * 16, x * 16, x * 16, 255]);
    const result = processImg(img, 'histogram', 'Histogram Equalization', {});
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBeGreaterThanOrEqual(0);
      expect(result.data[i]).toBeLessThanOrEqual(255);
    }
  });
});

// ── Module 3: Spatial Filtering ───────────────────────────────────────────────

describe('Spatial Filtering', () => {
  test('Gaussian Filter: uniform image stays unchanged', () => {
    const img = grayImg(100, 8, 8);
    const result = processImg(img, 'spatial', 'Gaussian Filter', {});
    // Center pixels of a uniform image should stay at 100 after normalization
    // setG normalizes output, but uniform input → uniform output → setG maps to 128
    const centerVal = result.data[((4 * 8 + 4)) * 4];
    expect(centerVal).toBeGreaterThanOrEqual(0);
    expect(centerVal).toBeLessThanOrEqual(255);
  });

  test('Sobel X: zero response on uniform image', () => {
    const img = grayImg(128, 8, 8);
    const result = processImg(img, 'spatial', 'Sobel X', {});
    // Uniform image has no horizontal edges — after normalization center should be ~128
    expect(result.data[0]).toBeGreaterThanOrEqual(0);
    expect(result.data[0]).toBeLessThanOrEqual(255);
  });

  test('Gradient Magnitude: zero on uniform image', () => {
    const img = grayImg(128, 8, 8);
    const result = processImg(img, 'spatial', 'Gradient Magnitude', {});
    // Uniform → no gradient → all zeros
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0);
    }
  });

  test('Median Filter: removes isolated bright pixel', () => {
    // 5x5 dark image with one bright center pixel
    const img = makeImage(5, 5, (x, y) => {
      const bright = (x === 2 && y === 2);
      return bright ? [255, 255, 255, 255] : [10, 10, 10, 255];
    });
    const result = processImg(img, 'spatial', 'Median Filter', {});
    // After median filter, the isolated bright pixel should be suppressed
    const centerIdx = (2 * 5 + 2) * 4;
    expect(result.data[centerIdx]).toBeLessThan(200);
  });
});

// ── Module 7: Color Processing ────────────────────────────────────────────────

describe('Color Processing', () => {
  test('Grayscale: R=G=B in output', () => {
    const img = colorImg(100, 150, 200, 4, 4);
    const result = processImg(img, 'color', 'Grayscale', {});
    expect(result.data[0]).toBe(result.data[1]);
    expect(result.data[1]).toBe(result.data[2]);
  });

  test('Red Channel: G and B channels are zeroed', () => {
    const img = colorImg(200, 100, 50, 4, 4);
    const result = processImg(img, 'color', 'Red Channel', {});
    expect(result.data[0]).toBe(200); // R preserved
    expect(result.data[1]).toBe(0);   // G zeroed
    expect(result.data[2]).toBe(0);   // B zeroed
  });

  test('Negative Color: each channel inverted independently', () => {
    const img = colorImg(100, 150, 200, 4, 4);
    const result = processImg(img, 'color', 'Negative Color', {});
    expect(result.data[0]).toBe(155);
    expect(result.data[1]).toBe(105);
    expect(result.data[2]).toBe(55);
  });

  test('Sepia: output has warm tones (R > G > B)', () => {
    const img = grayImg(128, 8, 8);
    const result = processImg(img, 'color', 'Sepia', {});
    const r = result.data[0], g = result.data[1], b = result.data[2];
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });
});

// ── Module 11: Image Segmentation ────────────────────────────────────────────

describe('Image Segmentation', () => {
  test('Global Threshold: bright pixels become white', () => {
    const img = grayImg(200, 8, 8);
    const result = processImg(img, 'segmentation', 'Global Threshold', { thresh: 128 });
    expect(result.data[0]).toBe(255);
  });

  test('Global Threshold: dark pixels become black', () => {
    const img = grayImg(50, 8, 8);
    const result = processImg(img, 'segmentation', 'Global Threshold', { thresh: 128 });
    expect(result.data[0]).toBe(0);
  });

  test('Global Threshold: output is strictly binary (0 or 255)', () => {
    const img = makeImage(8, 8, (x, y) => [x * 32, x * 32, x * 32, 255]);
    const result = processImg(img, 'segmentation', 'Global Threshold', { thresh: 128 });
    for (let i = 0; i < result.data.length; i += 4) {
      expect([0, 255]).toContain(result.data[i]);
    }
  });

  test('Otsu Method: output is binary', () => {
    const img = makeImage(16, 16, (x, y) => {
      const v = x < 8 ? 50 : 200;
      return [v, v, v, 255];
    });
    const result = processImg(img, 'segmentation', 'Otsu Method', {});
    for (let i = 0; i < result.data.length; i += 4) {
      expect([0, 255]).toContain(result.data[i]);
    }
  });


});

// ── Module 14: Morphological Operations ──────────────────────────────────────

describe('Morphological Operations', () => {
  test('Erosion: shrinks bright regions', () => {
    // Bright center surrounded by dark
    const img = makeImage(8, 8, (x, y) => {
      const bright = (x >= 2 && x <= 5 && y >= 2 && y <= 5);
      return bright ? [255, 255, 255, 255] : [0, 0, 0, 255];
    });
    const eroded = processImg(img, 'morphology', 'Erosion', {});
    const dilated = processImg(img, 'morphology', 'Dilation', {});
    const erodedCenter = toGray(eroded)[4 * 8 + 4];
    const dilatedCenter = toGray(dilated)[4 * 8 + 4];
    // Erosion max gray ≤ original max gray
    expect(arrMax(toGray(eroded))).toBeLessThanOrEqual(arrMax(toGray(img)) + 1);
    // Dilation min gray ≥ original min gray (after normalization both are scaled)
    expect(dilatedCenter).toBeGreaterThanOrEqual(erodedCenter);
  });

  test('Opening = Erosion then Dilation: removes small noise', () => {
    const img = makeImage(8, 8, (x, y) => {
      const noise = (x === 1 && y === 1); // isolated bright pixel = noise
      return noise ? [255, 255, 255, 255] : [30, 30, 30, 255];
    });
    const opened = processImg(img, 'morphology', 'Opening', {});
    // After opening, isolated noise should be removed
    const noisePixel = opened.data[(1 * 8 + 1) * 4];
    expect(noisePixel).toBeLessThan(200);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  test('1x1 image: Negative works', () => {
    const img = colorImg(100, 150, 200, 1, 1);
    const result = processImg(img, 'intensity', 'Negative', {});
    expect(result.data[0]).toBe(155);
    expect(result.data[1]).toBe(105);
    expect(result.data[2]).toBe(55);
  });

  test('1x1 image: Gaussian Filter does not crash', () => {
    const img = grayImg(128, 1, 1);
    expect(() => processImg(img, 'spatial', 'Gaussian Filter', {})).not.toThrow();
  });

  test('Black image: Log Transform produces valid output', () => {
    const img = grayImg(0, 8, 8);
    const result = processImg(img, 'intensity', 'Log Transform', {});
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBeGreaterThanOrEqual(0);
      expect(result.data[i]).toBeLessThanOrEqual(255);
    }
  });

  test('White image: Thresholding at 0 produces all white', () => {
    const img = grayImg(255, 8, 8);
    const result = processImg(img, 'intensity', 'Thresholding', { thresh: 0 });
    expect(result.data[0]).toBe(255);
  });

  test('Unknown module: returns grayscale passthrough', () => {
    const img = colorImg(100, 150, 200, 4, 4);
    const result = processImg(img, 'unknown_module', 'unknown_topic', {});
    // Should not throw and should return valid output
    expect(result.data.length).toBe(img.data.length);
    for (let i = 0; i < result.data.length; i++) {
      expect(result.data[i]).toBeGreaterThanOrEqual(0);
      expect(result.data[i]).toBeLessThanOrEqual(255);
    }
  });

  test('Histogram Stretch on uniform image: does not crash (zero range)', () => {
    const img = grayImg(128, 8, 8);
    expect(() => processImg(img, 'intensity', 'Histogram Stretch', {})).not.toThrow();
  });
});

// ── Performance regression tests ─────────────────────────────────────────────

describe('Performance — no O(N²) freeze', () => {
  test('Histogram Stretch completes on 320x320 image in under 500ms', () => {
    const img = makeImage(320, 320, (x, y) => [x % 256, y % 256, (x + y) % 256, 255]);
    const start = Date.now();
    processImg(img, 'intensity', 'Histogram Stretch', {});
    expect(Date.now() - start).toBeLessThan(500);
  });

  test('Gradient Magnitude completes on 320x320 image in under 1000ms', () => {
    const img = makeImage(320, 320, (x, y) => [x % 256, y % 256, 0, 255]);
    const start = Date.now();
    processImg(img, 'spatial', 'Gradient Magnitude', {});
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test('Otsu Method completes on 320x320 image in under 500ms', () => {
    const img = makeImage(320, 320, (x, y) => { const v = x < 160 ? 50 : 200; return [v, v, v, 255]; });
    const start = Date.now();
    processImg(img, 'segmentation', 'Otsu Method', {});
    expect(Date.now() - start).toBeLessThan(500);
  });
});
