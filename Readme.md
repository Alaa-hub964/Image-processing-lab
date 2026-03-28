# DIPT-Web — Interactive Image Processing Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black)](https://image-processing-lab-pied.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/Alaa-hub964/Image-processing-lab)](https://github.com/Alaa-hub964/Image-processing-lab/stargazers)

A browser-based interactive digital image processing educational platform implementing '17 modules' and '187 operations' entirely in pure JavaScript using the HTML5 Canvas API — no external image processing library required.

🔗 'Live Demo:' https://image-processing-lab-pied.vercel.app

---

## What It Does

DIPT-Web lets you apply classical image processing algorithms to images directly in your browser — no installation, no Python, no MATLAB, no account. Open the link and start processing immediately.

It also supports 'real-time live webcam processing' — point your camera at any object and see a live Sobel edge skeleton of the scene at ~30 fps.

---

## Modules

| # | Module | Operations |
|---|--------|-----------|
| 1 | ⚡ Intensity Transformations | Negative, Log, Gamma, Contrast Stretch, Bit-plane, Threshold, Sigmoid, Histogram Stretch |
| 2 | 📊 Histogram Processing | Equalization, CLAHE, PDF/CDF Plot, Local EQ, Gamma via CDF |
| 3 | 🔲 Spatial Filtering | Mean, Gaussian, Median, Sobel X/Y, Laplacian, Gradient Mag, Prewitt, Unsharp, Emboss, Sharpen |
| 4 | 〰️ Frequency Domain | DFT Spectrum, Ideal/Butterworth/Gaussian LP+HP, Band Reject/Pass, Homomorphic |
| 5 | 🔧 Image Restoration | Gaussian/S&P/Periodic/Speckle noise, Denoise Mean/Median/Gaussian, Wiener, Notch, Bilateral |
| 6 | 🎯 Geometric Transforms & Registration | Translation, Rotation, Scaling, Shear, Affine, Projective, Bilinear Interp, Harris, Homography |
| 7 | 🎨 Color Processing | RGB channels, HSV, YCbCr, LAB, Pseudocolor, Sepia, White Balance, Saturation |
| 8 | 🏥 Medical Imaging | CT windowing (Bone/Lung/Brain/Soft Tissue), MRI noise, Pseudo HU Color, Vessel Enhance |
| 9 | 🌊 Wavelets | Haar LL/LH/HL/HH, Soft/Hard Threshold, Multi-level, Edge, Reconstruct, Compress |
| 10 | 📦 Compression | DCT 8x8, Quantize HQ/LQ, JPEG artifact sim, Bit depth, Chroma subsampling, RLE |
| 11 | ✂️ Segmentation | Global/Otsu/Adaptive Threshold, Sobel/Laplacian/Canny edges, K-means 2/4, Hough, Watershed |
| 12 | 📐 Representation & Description | Boundary, Skeleton, Distance Transform, Convex Hull, GLCM, Zernike, Fourier Desc, Chain Code |
| 13 | 🔍 Feature Detection | Harris, Shi-Tomasi, FAST, DoG, HOG, LBP, ORB-like, Feature Heatmap |
| 14 | 🔬 Morphological Operations | Erosion, Dilation, Opening, Closing, Gradient, Top Hat, Black Hat, Thinning, Hit-or-Miss |
| 15 | 🌀 Gabor Filters & Texture | Gabor 0/45/90/135°, Gabor Energy, Multi-scale, Texture Segmentation 2/4 |
| 16 | 💨 Optical Flow | Lucas-Kanade, Horn-Schunck, Flow Vectors, Magnitude/Direction Map, Flow HSV, Flow Warp |
| 17 | 🔗 Feature Matching | BF Match, Ratio Test, RANSAC, Homography Warp, Template Match, KD-tree/LSH Sim |

---

## Features

- ✅ 'Zero installation' — runs in any modern browser
- ✅ 'No external image processing library' — pure JavaScript + HTML5 Canvas API
- ✅ '187 operations' across 17 modules
- ✅ 'Live webcam processing' — real-time Sobel edge detection at ~30 fps
- ✅ 'Three webcam modes' — Sobel edges, Neon colour edges, raw colour feed
- ✅ 'Side-by-side display' — original and processed canvases always visible
- ✅ 'RGB histograms' — update live on every parameter change
- ✅ 'Difference map' — shows |original − processed| pixel difference
- ✅ 'Theory accordion' — shows the mathematical formula for every operation
- ✅ 'Interactive sliders' — adjust gamma, threshold, filter order, cutoff frequency in real time
- ✅ 'Export button' — download processed image as PNG
- ✅ 'Quiz mode' — identify operations from processed images, score tracked
- ✅ 'Synthetic test image' — generated on first load, no upload required
- ✅ 'Fully mobile responsive' — bottom navigation bar on phones, all 187 operations accessible
- ✅ 'Touch optimized' — enlarged chips and slider thumbs for comfortable thumb interaction

---

## Getting Started

### Use the live deployment (recommended)

Open in any browser — no setup required:

```
https://image-processing-lab-pied.vercel.app
```

### Run locally

'Requirements:' Node.js 18 or higher, npm

```bash
# Clone the repository
git clone https://github.com/Alaa-hub964/Image-processing-lab.git
cd Image-processing-lab

# Install dependencies
npm install

# Start development server (with HTTPS for webcam support)
npm run dev
```

The app will be available at `image-processing-lab-pied.vercel.app`

> 'Note:' HTTPS is required for webcam access. The `vite-plugin-mkcert` package automatically generates a trusted local certificate on first run.

### Build for production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
Image-processing-lab/
├── src/
│   └── App.jsx          # Main application — all 187 operations
├── paper/
│   ├── paper.md         # JOSS paper
│   └── paper.bib        # BibTeX references
├── public/
├── index.html
├── vite.config.js       # Vite + mkcert HTTPS config
├── package.json
├── LICENSE              # MIT License
└── README.md
```

---

## Architecture

The entire processing pipeline is contained in `src/App.jsx`:

```
ImageData (RGBA pixel buffer)
        ↓
processImg(src, modId, topic, params)
        ↓
Module-specific algorithm (pure JavaScript)
        ↓
New ImageData → Canvas → Display
```

'Key technical decisions:'

- '`Float32Array` for intermediate results' — convolution outputs can be negative; clamping to `Uint8ClampedArray` too early loses information
- 'Loop-based `arrMin()`/`arrMax()`' — `Math.min(...largeArray)` causes stack overflow for images larger than ~256×256
- '`requestAnimationFrame` render loop' — synchronizes webcam processing with display refresh for smooth live edge detection
- 'Single pure function' — `processImg()` never mutates input, making all 187 operations testable in isolation

---

## Browser Compatibility

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 90+ | ✅ | Full support including webcam |
| Firefox 88+ | ✅ | Full support including webcam |
| Edge 90+ | ✅ | Full support including webcam |
| Safari 15+ | ✅ | Full support including webcam |
| Opera | ✅ | Requires HTTPS for webcam |
| Mobile Chrome/Safari | ✅ | Webcam uses front camera |
| Android 13 Chrome 114+ | ✅ | Full mobile layout + webcam |
| iOS 16 Safari 15+ | ✅ | Full mobile layout + webcam |

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI component framework |
| Vite | 5.4 | Build tool and dev server |
| HTML5 Canvas API | — | Pixel-level image processing |
| WebRTC getUserMedia | — | Live webcam access |
| vite-plugin-mkcert | — | Local HTTPS certificate for webcam |

'Runtime dependencies:' React 18 only.  
'No image processing libraries' (no OpenCV.js, no jimp, no sharp).

---

## Mobile Support

DIPT-Web is fully mobile responsive. On screens under 768px a 'bottom navigation bar' replaces the desktop sidebar, providing full access to all 187 operations on smartphones.

| Tab | Content |
|-----|---------|
| 🧠 MODULES | Scrollable list of all 17 modules |
| 🔬 OPS | Operation chips + parameter sliders for active module |
| 🖼️ CANVAS | Side-by-side original/processed canvas output |
| 📖 THEORY | Mathematical formulas accordion |

Touch targets are enlarged for comfortable use: operation chip padding increases from 4px to 13px, and slider thumb diameter from 13px to 22px. Validated on Android 13 (Chrome) and iOS 16 (Safari).

---

## Educational Use

DIPT-Web is designed to accompany a standard one-semester Digital Image Processing course. The 17 modules map directly to the chapter structure of:

> R. C. Gonzalez and R. E. Woods, *Digital Image Processing*, 4th ed., Pearson, 2018.

Each operation includes an inline theory accordion showing the mathematical formula and a brief description. Students can use the tool during lectures to immediately experiment with any algorithm being discussed.

---

## Contributing

Contributions are welcome. To add a new operation:

1. Add the topic string to the relevant module's `topics` array in `MODULES`
2. Add the mathematical description to the module's `theory` dictionary
3. Add the processing logic to `processImg()` inside the correct `modId` block
4. Test in the browser

To add a new module, add a new object to the `MODULES` array following the existing structure.

---

## Citation

If you use DIPT-Web in your research or teaching, please cite:

```bibtex
@article{Dipt_web_2026,
  author  = {Alowaidi, Alaa and Pateriya, Pushpendra Kumar},
  title   = {{DIPT-Web}: A Browser-Based Interactive Digital Image Processing Toolkit
             Implementing 17 Educational Modules in Pure {JavaScript}},
  journal = {Journal of Open Source Software},
  year    = {2026},
  url     = {https://github.com/Alaa-hub964/Image-processing-lab}
}
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

The authors thank Lovely Professional University for providing the academic environment that supported this work.
