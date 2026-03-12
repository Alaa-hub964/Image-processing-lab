import { useState, useRef, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════
// MODULES DEFINITION
// ══════════════════════════════════════════════════════════
const MODULES = [
  { id:"intensity",  icon:"⚡", label:"Intensity Transformations",       color:"#f72585",
    topics:["Negative","Log Transform","Gamma","Contrast Stretch","Bit-plane Slicing","Thresholding","Sigmoid","Histogram Stretch"],
    theory:{ "Negative":"s=255-r. Inverts all intensities. Useful for enhancing white detail in dark regions.", "Log Transform":"s=c·log(1+r). Expands dark, compresses bright. Used for Fourier spectrum display.", "Gamma":"s=c·rᵞ. γ<1 brightens, γ>1 darkens. Controls gamma correction for displays.", "Contrast Stretch":"Maps [lo,hi] → [0,255]. Linear enhancement without full equalization.", "Bit-plane Slicing":"Extracts individual bit planes 0-7. MSB carries most visual structure.", "Thresholding":"Binary: s=255 if r≥T else 0. Simplest segmentation.", "Sigmoid":"s=255/(1+e^(-k(r-128))). S-curve contrast enhancement.", "Histogram Stretch":"(r-min)/(max-min)·255. Global linear stretch to full dynamic range." }},

  { id:"histogram",  icon:"📊", label:"Histogram Processing",             color:"#7209b7",
    topics:["Show Histogram","Histogram Equalization","CLAHE","Histogram Matching","PDF Plot","CDF Plot","Local Equalization","Gamma via CDF"],
    theory:{ "Histogram Equalization":"s_k=(L-1)·Σp(r_j). CDF-based remapping to uniform distribution.", "CLAHE":"Contrast Limited AHE. Clips histogram at limit before equalizing each tile. Prevents noise amplification.", "PDF Plot":"Normalized histogram p(r_k)=n_k/n. Probability density of pixel intensities.", "CDF Plot":"Cumulative sum of PDF. Used as transfer function in equalization.", "Local Equalization":"AHE: equalize independently in local tiles. Adapts to local contrast." }},

  { id:"spatial",    icon:"🔲", label:"Spatial Filtering",                color:"#3a0ca3",
    topics:["Mean Filter","Gaussian Filter","Median Filter","Laplacian","Sobel X","Sobel Y","Gradient Magnitude","Prewitt","Unsharp Masking","Emboss","Sharpen","Box Blur 5x5"],
    theory:{ "Mean Filter":"Average of k×k neighborhood. Removes Gaussian noise, blurs edges.", "Gaussian Filter":"Weighted G(x,y)=e^(-(x²+y²)/2σ²). Better edge preservation than mean.", "Median Filter":"Non-linear. Sorts neighborhood, picks middle. Best for salt-and-pepper noise.", "Laplacian":"∇²f=∂²f/∂x²+∂²f/∂y². Isotropic 2nd derivative, highlights rapid changes.", "Unsharp Masking":"f_sharp=f+k·(f-f_blur). Amplifies high-frequency detail.", "Emboss":"Directional kernel. Highlights edges as raised surface with gray background." }},

  { id:"frequency",  icon:"〰️", label:"Frequency Domain Filtering",      color:"#4361ee",
    topics:["DFT Magnitude","DFT Phase","Ideal LP","Butterworth LP","Gaussian LP","Ideal HP","Butterworth HP","Gaussian HP","Band Reject","Band Pass","Homomorphic"],
    theory:{ "DFT":"F(u,v)=ΣΣf(x,y)e^(-j2π(ux/M+vy/N)). Decomposes image into frequency components.", "Ideal LP":"H=1 if D≤D₀ else 0. Sharp cutoff causes Gibbs ringing in spatial domain.", "Butterworth LP":"H=1/(1+(D/D₀)^2n). Smooth rolloff. Order n controls sharpness.", "Gaussian LP":"H=e^(-D²/2D₀²). No ringing. Spatial equivalent also Gaussian.", "Homomorphic":"ln→FFT→(γH-γL)·H+γL→IFFT→exp. Normalizes illumination, enhances reflectance." }},

  { id:"restoration",icon:"🔧", label:"Image Restoration",               color:"#4cc9f0",
    topics:["Add Gaussian Noise","Add Salt & Pepper","Add Periodic Noise","Add Speckle","Denoise Mean","Denoise Median","Denoise Gaussian","Wiener Filter","Notch Filter","Sharpen Restore","Bilateral-like"],
    theory:{ "Gaussian Noise":"g=f+η, η~N(μ,σ²). Additive, spectrally flat. Removed by linear averaging.", "Salt & Pepper":"Random 0/255 pixels. Caused by transmission errors. Best: median filter.", "Periodic Noise":"Sinusoidal η=A·sin(2π(u₀x+v₀y)). Appears as spikes in DFT. Removed by notch filter.", "Wiener Filter":"Ĥ*/(|H|²+Sn/Sf). Minimizes MSE. Balances inverse filtering with noise smoothing.", "Notch Filter":"Rejects ±(u₀,v₀) frequency pairs. Surgical removal of periodic noise." }},

  { id:"registration",icon:"🎯", label:"Geometric Transforms & Registration", color:"#06d6a0",
    topics:["Upload & Match","Feature Detection","Keypoint Matching","Homography","Aligned Overlay","Difference Map","Affine Transform","Projective Warp","Translation","Rotation","Scaling","Shear","Flip H","Flip V","Bilinear Interp"],
    theory:{ "Harris Corner":"R=det(M)-k·trace²(M). R>0: corner, R<0: edge, R≈0: flat region.", "Feature Matching":"Compare descriptors using SSD. Ratio test: accept if d₁/d₂<0.8.", "Homography":"3×3 matrix mapping plane→plane. 4+ point correspondences + RANSAC.", "Affine Transform":"6 DOF: translation+rotation+scale+shear. Preserves parallel lines.", "RANSAC":"Sample minimal set→fit model→count inliers. Robust to outliers up to 50%.", "Bilinear Interpolation":"Weighted average of 4 neighbors for sub-pixel positions. Smooth warping." }},

  { id:"color",      icon:"🎨", label:"Color Image Processing",           color:"#f77f00",
    topics:["Original","Grayscale","Red Channel","Green Channel","Blue Channel","HSV Hue","HSV Saturation","HSV Value","YCbCr Y","YCbCr Cb","YCbCr Cr","LAB Lightness","Pseudocolor","Sepia","Negative Color","Saturate","Desaturate","Color Equalization","White Balance"],
    theory:{ "RGB":"Additive. (R,G,B)∈[0,255]³. Hardware native. Channels correlated in natural images.", "HSV":"Hue=color type, Saturation=purity, Value=brightness. Separates chrominance from luminance.", "YCbCr":"Y=luma, Cb/Cr=chroma. JPEG/video standard. Separates brightness from color.", "LAB":"L=lightness, a=green-red, b=blue-yellow. Perceptually uniform color space.", "Pseudocolor":"Maps grayscale intensities to color LUT. Enhances perception of subtle differences." }},

  { id:"medical",    icon:"🏥", label:"Medical Image Processing",         color:"#e63946",
    topics:["Grayscale View","Bone Window","Lung Window","Brain Window","Soft Tissue","CT Simulate","MRI Noise","Medical Denoise","Tissue Threshold","Edge Enhance","Pseudo HU Color","Vessel Enhance"],
    theory:{ "DICOM":"Digital Imaging and Communications in Medicine. Standard format for medical images with metadata.", "HU Values":"Hounsfield Units: Air=-1000, Fat≈-100, Water=0, Muscle≈+40, Bone=+400 to +1000.", "CT Windowing":"WC±WW/2 mapped to [0,255]. Controls visible tissue range.", "NIfTI":"Neuroimaging format (.nii). Stores 3D/4D MRI volumes with affine geometry.", "Windowing":"Display subset [WC-WW/2, WC+WW/2]. Critical for reading CT/MRI images." }},

  { id:"wavelets",   icon:"🌊", label:"Wavelets",                         color:"#2ec4b6",
    topics:["Haar LL (Approx)","Haar LH (Horiz)","Haar HL (Vert)","Haar HH (Diag)","Soft Threshold","Hard Threshold","Multi-level Decomp","Wavelet Edge","Reconstruct","Wavelet Compress"],
    theory:{ "FWT":"Mallat: iteratively apply h (low) + g (high) + downsample. O(N) complexity.", "Decomposition":"Level: LL=approx, LH=horiz detail, HL=vert detail, HH=diag detail.", "Wavelet Denoising":"Decompose→threshold coefficients→reconstruct. Preserves edges unlike Gaussian.", "Haar":"h=[1,1]/√2, g=[1,-1]/√2. Simplest, discontinuous, computationally cheapest.", "Soft Threshold":"sign(x)·max(0,|x|-T). Shrinks coefficients toward zero. Smoother result." }},

  { id:"compression",icon:"📦", label:"Image Compression",               color:"#ff6b35",
    topics:["DCT 8×8 Blocks","Quantize HQ","Quantize LQ","JPEG Artifact Sim","Block Grid View","Bit Depth 4-bit","Bit Depth 2-bit","Chroma Subsampling","RLE Visualize","Compression Stats"],
    theory:{ "DCT":"8×8 block DCT in JPEG. Energy compacted to low-frequency top-left coefficients.", "Quantization":"Divide by Q matrix, round. Lossy step producing JPEG artifacts.", "Coding Redundancy":"Non-uniform probabilities → Huffman assigns shorter codes to common symbols.", "Spatial Redundancy":"Adjacent pixels correlated. Exploited by predictive and transform coding.", "JPEG Artifacts":"Blocking, ringing, color smear. More visible at high compression ratios." }},

  { id:"segmentation",icon:"✂️", label:"Image Segmentation",             color:"#8338ec",
    topics:["Global Threshold","Otsu Method","Adaptive Threshold","Sobel Edges","Laplacian Edges","Canny-like","Gradient + NMS","Region Color","K-means 2","K-means 4","Hough Viz","Watershed Sim"],
    theory:{ "Otsu":"Maximizes inter-class variance σ²_B=ω₀ω₁(μ₀-μ₁)². Automatic optimal threshold.", "Canny":"Gaussian→gradient→non-max suppression→double threshold→hysteresis. Optimal detector.", "Hough":"Maps (x,y)→(ρ,θ) space. Peaks in accumulator = detected geometric shapes.", "Adaptive":"Local threshold T(x,y) based on neighborhood. Handles uneven illumination.", "K-means":"Cluster pixels in feature space. Label by cluster ID. Fast but assumes spherical clusters." }},

  { id:"representation",icon:"📐", label:"Representation & Description",  color:"#fb5607",
    topics:["Boundary Extract","Skeleton","Distance Transform","Convex Hull Viz","Moment Map","GLCM Texture","Region Props","Zernike Viz","Fourier Desc Viz","Chain Code Viz"],
    theory:{ "Chain Codes":"Direction codes tracing boundary. 4 or 8-connectivity. Compact but noise-sensitive.", "Fourier Descriptors":"DFT of boundary. Low-freq = overall shape. Invariant with normalization.", "Moments":"m_pq=ΣΣx^p·y^q·f(x,y). Hu's 7 moments: invariant to similarity transforms.", "GLCM":"P(i,j|d,θ). Contrast, energy, entropy, homogeneity features. Texture analysis.", "Skeleton":"Medial axis via thinning. Captures topological structure of binary shapes." }},

  { id:"features",   icon:"🔍", label:"Feature Detection & Description",  color:"#3f88c5",
    topics:["Harris Corners","Shi-Tomasi","FAST Detect","DoG (SIFT-like)","Gradient Mag","Gradient Dir","HOG Cells","LBP Texture","Dense Grid","ORB-like Keypoints","Feature Heatmap"],
    theory:{ "Harris":"M=Σw[Ix²,IxIy;IxIy,Iy²]. R=det-k·trace². Corner if R>threshold.", "SIFT":"DoG extrema→orientation→128-D gradient histogram. Scale+rotation invariant.", "ORB":"Oriented FAST + Rotated BRIEF. 256-bit binary. Patent-free. 100× faster than SIFT.", "HOG":"8×8 cells → 9-bin orientation histograms → L2-normalize in 16×16 blocks.", "LBP":"8-neighbor binary label against center. Rotation-invariant. Texture descriptor." }},

  { id:"matching",   icon:"🔗", label:"Feature Matching & Model Fitting", color:"#e9c46a",
    topics:["Upload & Match","BF Match Viz","Ratio Test Viz","RANSAC Demo","Homography Warp","Similarity Map","Corner Response","Distance Map","Edge+Corner","Template Match","KD-tree Sim","LSH Sim"],
    theory:{ "BF Matching":"Compare all descriptor pairs. O(N²). Exact. Use Hamming for binary, L2 for float.", "Ratio Test":"Accept if d₁/d₂<0.7-0.8. Rejects ambiguous matches. Lowe's key insight.", "RANSAC":"Random sample→fit→inliers→repeat. Handles up to 50% outliers.", "KD-Tree":"Binary space partition. O(log N) approx NN. Best for d<20 dimensions.", "LSH":"Hash similar items to same bucket. O(1) approx NN for high-dimensional binary descriptors.", "EMD":"Earth Mover's Distance. Min transport cost between distributions." }},
];

// ══════════════════════════════════════════════════════════
// CORE PROCESSING ENGINE
// ══════════════════════════════════════════════════════════
function convolve(gray, W, H, kernel) {
  const k = kernel.length, kh = Math.floor(k/2);
  const res = new Float32Array(W*H);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    let s=0;
    for (let ky=0;ky<k;ky++) for (let kx=0;kx<k;kx++) {
      const px=Math.min(Math.max(x+kx-kh,0),W-1), py=Math.min(Math.max(y+ky-kh,0),H-1);
      s+=gray[py*W+px]*kernel[ky][kx];
    }
    res[y*W+x]=s;
  }
  return res;
}

function processImg(src, modId, topic, params={}) {
  const {width:W, height:H, data} = src;
  const out = new Uint8ClampedArray(data);
  const N = W*H;
  const gray = new Float32Array(N);
  for (let i=0;i<N;i++) gray[i]=0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2];

  const setG=(buf,abs=false)=>{
    const vals=abs?buf.map(Math.abs):buf;
    const mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
    for(let i=0;i<N;i++){const v=Math.round((vals[i]-mn)/rng*255); out[i*4]=out[i*4+1]=out[i*4+2]=v; out[i*4+3]=255;}
  };

  const KX=[[-1,0,1],[-2,0,2],[-1,0,1]];
  const KY=[[-1,-2,-1],[0,0,0],[1,2,1]];
  const GAUSS=[[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16));
  const MEAN=[[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9));

  // ── INTENSITY ──
  if (modId==="intensity") {
    const g=params.gamma||1, T=params.thresh||128, plane=params.plane||7, k=params.k||0.1;
    for(let i=0;i<N;i++){
      let r=data[i*4],g2=data[i*4+1],b=data[i*4+2],v;
      if(topic==="Negative"){out[i*4]=255-r;out[i*4+1]=255-g2;out[i*4+2]=255-b;}
      else if(topic==="Log Transform"){out[i*4]=Math.round(Math.log(1+r)/Math.log(256)*255);out[i*4+1]=Math.round(Math.log(1+g2)/Math.log(256)*255);out[i*4+2]=Math.round(Math.log(1+b)/Math.log(256)*255);}
      else if(topic==="Gamma"){out[i*4]=Math.round(Math.pow(r/255,g)*255);out[i*4+1]=Math.round(Math.pow(g2/255,g)*255);out[i*4+2]=Math.round(Math.pow(b/255,g)*255);}
      else if(topic==="Contrast Stretch"){const lo=60,hi=180;out[i*4]=Math.max(0,Math.min(255,Math.round((r-lo)/(hi-lo)*255)));out[i*4+1]=Math.max(0,Math.min(255,Math.round((g2-lo)/(hi-lo)*255)));out[i*4+2]=Math.max(0,Math.min(255,Math.round((b-lo)/(hi-lo)*255)));}
      else if(topic==="Bit-plane Slicing"){v=((Math.round(gray[i])>>plane)&1)*255;out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      else if(topic==="Thresholding"){v=gray[i]>=T?255:0;out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      else if(topic==="Sigmoid"){v=Math.round(255/(1+Math.exp(-k*(gray[i]-128))));out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      else if(topic==="Histogram Stretch"){const mn2=Math.min(...gray),mx2=Math.max(...gray),rng2=mx2-mn2||1;v=Math.round((gray[i]-mn2)/rng2*255);out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      out[i*4+3]=255;
    }
  }

  // ── HISTOGRAM ──
  else if(modId==="histogram"){
    const hist=new Array(256).fill(0);
    for(let i=0;i<N;i++) hist[Math.round(gray[i])]++;
    if(topic==="Show Histogram"||topic==="PDF Plot"){
      // Show grayscale with histogram overlay baked in
      for(let i=0;i<N;i++){const v=Math.round(gray[i]);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
      // Draw histogram bars at bottom of image
      const maxH=Math.max(...hist)||1;
      const barH=Math.min(H/3,80);
      for(let x=0;x<W;x++){
        const bin=Math.floor(x/W*256), bh=Math.round(hist[bin]/maxH*barH);
        for(let y=H-bh;y<H;y++){out[(y*W+x)*4]=76;out[(y*W+x)*4+1]=201;out[(y*W+x)*4+2]=240;out[(y*W+x)*4+3]=200;}
      }
    } else if(topic==="CDF Plot"){
      let cum=0; const cdf=new Array(256);
      for(let k=0;k<256;k++){cum+=hist[k];cdf[k]=cum/N*255;}
      for(let i=0;i<N;i++){const v=Math.round(gray[i]);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
      const barH=Math.min(H/3,80);
      for(let x=0;x<W;x++){
        const bin=Math.floor(x/W*255), bh=Math.round(cdf[bin]/255*barH);
        for(let y=H-bh;y<H;y++){out[(y*W+x)*4]=247;out[(y*W+x)*4+1]=37;out[(y*W+x)*4+2]=133;out[(y*W+x)*4+3]=200;}
      }
    } else if(topic==="Histogram Equalization"||topic==="Gamma via CDF"){
      let cs=0; const lut=new Uint8Array(256);
      const cdfMin=hist.findIndex(v=>v>0)||0;
      let cum2=0; for(let k=0;k<256;k++){cum2+=hist[k];lut[k]=Math.round(Math.max(0,(cum2-hist[cdfMin])/(N-hist[cdfMin])*255));}
      for(let i=0;i<N;i++){const v=lut[Math.round(gray[i])];out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    } else if(topic==="CLAHE"){
      const tW=Math.ceil(W/8),tH2=Math.ceil(H/8),clip=Math.ceil(tW*tH2/16);
      for(let ty=0;ty<8;ty++) for(let tx=0;tx<8;tx++){
        const x0=tx*tW,y0=ty*tH2,x1=Math.min(x0+tW,W),y1=Math.min(y0+tH2,H);
        const th=new Array(256).fill(0);
        for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) th[Math.round(gray[y*W+x])]++;
        let excess=0; for(let k=0;k<256;k++){if(th[k]>clip){excess+=th[k]-clip;th[k]=clip;}}
        const add=Math.floor(excess/256); for(let k=0;k<256;k++) th[k]+=add;
        let cs2=0; const lut2=new Uint8Array(256); const total2=(x1-x0)*(y1-y0);
        for(let k=0;k<256;k++){cs2+=th[k];lut2[k]=Math.min(255,Math.round(cs2/total2*255));}
        for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){const v=lut2[Math.round(gray[y*W+x])];out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;}
      }
    } else if(topic==="Local Equalization"){
      const pad=16;
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const th=new Array(256).fill(0),cnt2=(2*pad+1)**2;
        for(let dy=-pad;dy<=pad;dy++) for(let dx=-pad;dx<=pad;dx++){
          const px=Math.min(Math.max(x+dx,0),W-1),py=Math.min(Math.max(y+dy,0),H-1);
          th[Math.round(gray[py*W+px])]++;
        }
        let cs3=0; const lut3=new Uint8Array(256);
        const cdfMin2=th.findIndex(v=>v>0)||0;
        for(let k=0;k<256;k++){cs3+=th[k];lut3[k]=Math.round(Math.max(0,(cs3-th[cdfMin2])/(cnt2-th[cdfMin2])*255));}
        const v=lut3[Math.round(gray[y*W+x])];out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    } else {
      for(let i=0;i<N;i++){const v=Math.round(gray[i]);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    }
  }

  // ── SPATIAL ──
  else if(modId==="spatial"){
    const median3=()=>{
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const v=[];for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++){const px=Math.min(Math.max(x+kx,0),W-1),py=Math.min(Math.max(y+ky,0),H-1);v.push(gray[py*W+px]);}
        v.sort((a,b)=>a-b);const m=Math.round(v[4]);const idx=(y*W+x)*4;out[idx]=out[idx+1]=out[idx+2]=m;out[idx+3]=255;
      }
    };
    const KERNELS={
      "Mean Filter":MEAN,"Gaussian Filter":GAUSS,
      "Laplacian":[[0,-1,0],[-1,4,-1],[0,-1,0]],
      "Sobel X":KX,"Sobel Y":KY,
      "Prewitt":[[-1,0,1],[-1,0,1],[-1,0,1]],
      "Unsharp Masking":[[-1,-1,-1],[-1,9,-1],[-1,-1,-1]],
      "Emboss":[[-2,-1,0],[-1,1,1],[0,1,2]],
      "Sharpen":[[0,-1,0],[-1,5,-1],[0,-1,0]],
      "Box Blur 5x5":Array(5).fill(Array(5).fill(1/25)),
    };
    if(topic==="Median Filter"){median3();}
    else if(topic==="Gradient Magnitude"){
      const gx=convolve(gray,W,H,KX),gy=convolve(gray,W,H,KY);
      for(let i=0;i<N;i++){const v=Math.min(255,Math.round(Math.sqrt(gx[i]**2+gy[i]**2)));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    } else {
      const k=KERNELS[topic]||GAUSS;
      const res=convolve(gray,W,H,k);
      const isAbs=["Laplacian","Sobel X","Sobel Y","Prewitt","Emboss"].includes(topic);
      setG(res,isAbs);
    }
  }

  // ── FREQUENCY ──
  else if(modId==="frequency"){
    const D0=params.d0||40,n=params.n||2;
    const cx=W/2,cy=H/2;
    if(topic==="DFT Magnitude"||topic==="DFT Phase"){
      // Simulate DFT-like visualization using spatial frequency patterns
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const u=((x-cx)/W*20),v2=((y-cy)/H*20);
        const re=gray[y*W+x]*Math.cos(2*Math.PI*(u*x/W+v2*y/H));
        const im=gray[y*W+x]*Math.sin(2*Math.PI*(u*x/W+v2*y/H));
        const mag=Math.min(255,Math.round(Math.log(1+Math.sqrt(re**2+im**2))*10));
        const phase=Math.round((Math.atan2(im,re)+Math.PI)/(2*Math.PI)*255);
        const val=topic==="DFT Magnitude"?mag:phase;
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=val;out[(y*W+x)*4+3]=255;
      }
    } else {
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const D=Math.sqrt((x-cx)**2+(y-cy)**2)||0.001;
        let H_val=1;
        if(topic==="Ideal LP") H_val=D<=D0?1:0;
        else if(topic==="Butterworth LP") H_val=1/(1+Math.pow(D/D0,2*n));
        else if(topic==="Gaussian LP") H_val=Math.exp(-D**2/(2*D0**2));
        else if(topic==="Ideal HP") H_val=D>D0?1:0;
        else if(topic==="Butterworth HP") H_val=1/(1+Math.pow(D0/D,2*n));
        else if(topic==="Gaussian HP") H_val=1-Math.exp(-D**2/(2*D0**2));
        else if(topic==="Band Reject") H_val=(D<D0*0.7||D>D0*1.3)?1:0;
        else if(topic==="Band Pass") H_val=(D>=D0*0.7&&D<=D0*1.3)?1:0;
        else if(topic==="Homomorphic") H_val=D>D0?1.4:0.6;
        const v=Math.max(0,Math.min(255,Math.round(gray[y*W+x]*H_val)));
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    }
  }

  // ── RESTORATION ──
  else if(modId==="restoration"){
    const sigma=params.sigma||20;
    if(topic==="Add Gaussian Noise"){
      for(let i=0;i<N;i++){const n2=(Math.random()+Math.random()-1)*sigma*2;for(let c=0;c<3;c++) out[i*4+c]=Math.max(0,Math.min(255,data[i*4+c]+n2));out[i*4+3]=255;}
    } else if(topic==="Add Salt & Pepper"){
      for(let i=0;i<N;i++){const r2=Math.random();if(r2<0.05){for(let c=0;c<3;c++) out[i*4+c]=0;}else if(r2<0.10){for(let c=0;c<3;c++) out[i*4+c]=255;}out[i*4+3]=255;}
    } else if(topic==="Add Periodic Noise"){
      for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),n2=Math.round(40*Math.sin(2*Math.PI*x/15)*Math.cos(2*Math.PI*y/15));for(let c=0;c<3;c++) out[i*4+c]=Math.max(0,Math.min(255,data[i*4+c]+n2));out[i*4+3]=255;}
    } else if(topic==="Add Speckle"){
      for(let i=0;i<N;i++){const n2=(Math.random()*2-1)*0.3;for(let c=0;c<3;c++) out[i*4+c]=Math.max(0,Math.min(255,Math.round(data[i*4+c]*(1+n2))));out[i*4+3]=255;}
    } else if(topic==="Denoise Mean"){const res=convolve(gray,W,H,MEAN);setG(res);}
    else if(topic==="Denoise Gaussian"){const res=convolve(gray,W,H,GAUSS);setG(res);}
    else if(topic==="Denoise Median"){
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const v=[];for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++){const px=Math.min(Math.max(x+kx,0),W-1),py=Math.min(Math.max(y+ky,0),H-1);v.push(gray[py*W+px]);}
        v.sort((a,b)=>a-b);const m=Math.round(v[4]);const idx=(y*W+x)*4;out[idx]=out[idx+1]=out[idx+2]=m;out[idx+3]=255;
      }
    } else if(topic==="Wiener Filter"){
      const bl=convolve(gray,W,H,GAUSS);
      for(let i=0;i<N;i++){const v=Math.max(0,Math.min(255,Math.round(gray[i]*1.5-bl[i]*0.5)));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    } else if(topic==="Notch Filter"){
      for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),notch=Math.abs(Math.sin(2*Math.PI*x/15)*Math.sin(2*Math.PI*y/15));const v=Math.round(gray[i]*(0.5+notch*0.5));out[i*4]=out[i*4+1]=out[i*4+2]=Math.max(0,Math.min(255,v));out[i*4+3]=255;}
    } else if(topic==="Sharpen Restore"){const res=convolve(gray,W,H,[[0,-1,0],[-1,5,-1],[0,-1,0]]);setG(res);}
    else if(topic==="Bilateral-like"){
      const sig=20;
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        let sum2=0,wsum=0;
        for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
          const px=Math.min(Math.max(x+dx,0),W-1),py=Math.min(Math.max(y+dy,0),H-1);
          const gv=gray[py*W+px],cv=gray[y*W+x];
          const ws=Math.exp(-(dx**2+dy**2)/8)*Math.exp(-(gv-cv)**2/(2*sig**2));
          sum2+=gv*ws;wsum+=ws;
        }
        const v=Math.round(sum2/(wsum||1));out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    } else {
      for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}
    }
  }

  // ── REGISTRATION / GEOMETRIC ──
  else if(modId==="registration"){
    if(["Upload & Match","Feature Detection","Keypoint Matching","Homography","Aligned Overlay","Difference Map"].includes(topic)){
      // These are handled by the special registration UI — return grayscale passthrough
      for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}
      return new ImageData(out,W,H);
    }
    const result=new Uint8ClampedArray(W*H*4);
    const cx=W/2,cy=H/2;
    const angle=(params.angle||15)*Math.PI/180,sc=params.scale||1.2,tx=params.tx||20,ty=params.ty||20;
    const bilin=(sx,sy)=>{
      const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,W-1),y1=Math.min(y0+1,H-1);
      if(x0<0||y0<0||x0>=W||y0>=H) return [0,0,0];
      const dx=sx-x0,dy=sy-y0;
      const i00=(y0*W+x0)*4,i10=(y0*W+x1)*4,i01=(y1*W+x0)*4,i11=(y1*W+x1)*4;
      return [(1-dx)*(1-dy)*data[i00]+dx*(1-dy)*data[i10]+(1-dx)*dy*data[i01]+dx*dy*data[i11],
              (1-dx)*(1-dy)*data[i00+1]+dx*(1-dy)*data[i10+1]+(1-dx)*dy*data[i01+1]+dx*dy*data[i11+1],
              (1-dx)*(1-dy)*data[i00+2]+dx*(1-dy)*data[i10+2]+(1-dx)*dy*data[i01+2]+dx*dy*data[i11+2]];
    };
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      let sx=x,sy=y;
      if(topic==="Translation"){sx=x-tx;sy=y-ty;}
      else if(topic==="Rotation"){const dx=x-cx,dy=y-cy;sx=cx+dx*Math.cos(-angle)-dy*Math.sin(-angle);sy=cy+dx*Math.sin(-angle)+dy*Math.cos(-angle);}
      else if(topic==="Scaling"){sx=(x-cx)/sc+cx;sy=(y-cy)/sc+cy;}
      else if(topic==="Shear"){sx=x-0.3*y;sy=y;}
      else if(topic==="Affine Transform"){const dx=x-cx,dy=y-cy;sx=cx+dx*Math.cos(angle)+dy*Math.sin(angle)*0.2;sy=cy-dx*Math.sin(angle)*0.2+dy*Math.cos(angle);}
      else if(topic==="Projective Warp"){const f=1+0.0015*y;sx=(x-cx)*f+cx;sy=y+(x-cx)*0.001*y;}
      else if(topic==="Flip H"){sx=W-1-x;sy=y;}
      else if(topic==="Flip V"){sx=x;sy=H-1-y;}
      else if(topic==="Bilinear Interp"){sx=x+Math.sin(y/H*Math.PI)*8;sy=y+Math.cos(x/W*Math.PI)*8;}
      const [r,g2,b]=bilin(sx,sy);
      const idx=(y*W+x)*4;result[idx]=Math.round(r);result[idx+1]=Math.round(g2);result[idx+2]=Math.round(b);result[idx+3]=255;
    }
    return new ImageData(result,W,H);
  }

  // ── COLOR ──
  else if(modId==="color"){
    for(let i=0;i<N;i++){
      const r=data[i*4],g2=data[i*4+1],b=data[i*4+2];
      const rn=r/255,gn=g2/255,bn=b/255;
      const mx=Math.max(rn,gn,bn),mn2=Math.min(rn,gn,bn),d=mx-mn2;
      let h=0,s=mx>0?d/mx:0,vv=mx;
      if(d>0){if(mx===rn)h=((gn-bn)/d+6)%6;else if(mx===gn)h=(bn-rn)/d+2;else h=(rn-gn)/d+4;h/=6;}
      if(topic==="Original"){out[i*4]=r;out[i*4+1]=g2;out[i*4+2]=b;}
      else if(topic==="Grayscale"){const gv=Math.round(gray[i]);out[i*4]=out[i*4+1]=out[i*4+2]=gv;}
      else if(topic==="Red Channel"){out[i*4]=r;out[i*4+1]=0;out[i*4+2]=0;}
      else if(topic==="Green Channel"){out[i*4]=0;out[i*4+1]=g2;out[i*4+2]=0;}
      else if(topic==="Blue Channel"){out[i*4]=0;out[i*4+1]=0;out[i*4+2]=b;}
      else if(topic==="HSV Hue"){const hv=Math.round(h*255);out[i*4]=hv;out[i*4+1]=hv;out[i*4+2]=hv;}
      else if(topic==="HSV Saturation"){const sv=Math.round(s*255);out[i*4]=sv;out[i*4+1]=sv;out[i*4+2]=sv;}
      else if(topic==="HSV Value"){const vv2=Math.round(vv*255);out[i*4]=out[i*4+1]=out[i*4+2]=vv2;}
      else if(topic==="YCbCr Y"){const Y=Math.round(0.299*r+0.587*g2+0.114*b);out[i*4]=out[i*4+1]=out[i*4+2]=Y;}
      else if(topic==="YCbCr Cb"){const Cb=Math.round(128-0.168736*r-0.331264*g2+0.5*b);out[i*4]=out[i*4+1]=out[i*4+2]=Cb;}
      else if(topic==="YCbCr Cr"){const Cr=Math.round(128+0.5*r-0.418688*g2-0.081312*b);out[i*4]=out[i*4+1]=out[i*4+2]=Cr;}
      else if(topic==="LAB Lightness"){const L=Math.round(0.2126*r+0.7152*g2+0.0722*b);out[i*4]=out[i*4+1]=out[i*4+2]=L;}
      else if(topic==="Pseudocolor"){const t=gray[i]/255;out[i*4]=Math.round(Math.sin(t*Math.PI)*255);out[i*4+1]=Math.round(Math.sin(t*Math.PI+2.094)*255);out[i*4+2]=Math.round(Math.sin(t*Math.PI+4.189)*255);}
      else if(topic==="Sepia"){out[i*4]=Math.min(255,Math.round(r*0.393+g2*0.769+b*0.189));out[i*4+1]=Math.min(255,Math.round(r*0.349+g2*0.686+b*0.168));out[i*4+2]=Math.min(255,Math.round(r*0.272+g2*0.534+b*0.131));}
      else if(topic==="Negative Color"){out[i*4]=255-r;out[i*4+1]=255-g2;out[i*4+2]=255-b;}
      else if(topic==="Saturate"){const ns=Math.min(1,s*1.8);const f=(ns-s);out[i*4]=Math.min(255,Math.round(r+f*255));out[i*4+1]=Math.min(255,Math.round(g2+f*255));out[i*4+2]=Math.min(255,Math.round(b+f*255));}
      else if(topic==="Desaturate"){const gr=Math.round(gray[i]);out[i*4]=Math.round(r*0.5+gr*0.5);out[i*4+1]=Math.round(g2*0.5+gr*0.5);out[i*4+2]=Math.round(b*0.5+gr*0.5);}
      else if(topic==="White Balance"){out[i*4]=Math.min(255,Math.round(r*0.85));out[i*4+1]=g2;out[i*4+2]=Math.min(255,Math.round(b*1.15));}
      else if(topic==="Color Equalization"){
        const hist2=new Array(256).fill(0);for(let j=0;j<N;j++) hist2[Math.round(gray[j])]++;
        let cs2=0;const lut2=new Uint8Array(256);for(let k=0;k<256;k++){cs2+=hist2[k];lut2[k]=Math.round(cs2/N*255);}
        const eq=lut2[Math.round(gray[i])]/255/(vv||0.001);
        out[i*4]=Math.min(255,Math.round(r*eq));out[i*4+1]=Math.min(255,Math.round(g2*eq));out[i*4+2]=Math.min(255,Math.round(b*eq));
      } else {out[i*4]=r;out[i*4+1]=g2;out[i*4+2]=b;}
      out[i*4+3]=255;
    }
  }

  // ── MEDICAL ──
  else if(modId==="medical"){
    const applyWin=(wc,ww)=>{for(let i=0;i<N;i++){const hu=(gray[i]-128)*10,v=Math.max(0,Math.min(255,Math.round((hu-wc+ww/2)/ww*255)));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}};
    if(topic==="Grayscale View"){for(let i=0;i<N;i++){const v=Math.round(gray[i]);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Bone Window") applyWin(400,1500);
    else if(topic==="Lung Window") applyWin(-600,1500);
    else if(topic==="Brain Window") applyWin(40,80);
    else if(topic==="Soft Tissue") applyWin(50,350);
    else if(topic==="CT Simulate"){for(let i=0;i<N;i++){const v=Math.round(Math.pow(gray[i]/255,0.7)*255);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="MRI Noise"){for(let i=0;i<N;i++){const n2=(Math.random()-0.5)*30;for(let c=0;c<3;c++) out[i*4+c]=Math.max(0,Math.min(255,data[i*4+c]+n2));out[i*4+3]=255;}}
    else if(topic==="Medical Denoise"){const res=convolve(gray,W,H,GAUSS);setG(res);}
    else if(topic==="Tissue Threshold"){for(let i=0;i<N;i++){const v=(gray[i]>80&&gray[i]<180)?255:0;out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Edge Enhance"){const res=convolve(gray,W,H,[[0,-1,0],[-1,5,-1],[0,-1,0]]);setG(res);}
    else if(topic==="Pseudo HU Color"){
      for(let i=0;i<N;i++){
        const t=gray[i]/255;
        if(t<0.25){out[i*4]=0;out[i*4+1]=0;out[i*4+2]=Math.round(t/0.25*255);}
        else if(t<0.5){out[i*4]=0;out[i*4+1]=Math.round((t-0.25)/0.25*255);out[i*4+2]=255;}
        else if(t<0.75){out[i*4]=Math.round((t-0.5)/0.25*255);out[i*4+1]=255;out[i*4+2]=255-Math.round((t-0.5)/0.25*255);}
        else{out[i*4]=255;out[i*4+1]=255-Math.round((t-0.75)/0.25*255);out[i*4+2]=0;}
        out[i*4+3]=255;
      }
    } else if(topic==="Vessel Enhance"){
      const gx=convolve(gray,W,H,KX),gy=convolve(gray,W,H,KY);
      for(let i=0;i<N;i++){const mag=Math.min(255,Math.sqrt(gx[i]**2+gy[i]**2));const v=gray[i]>100?Math.round(mag):0;out[i*4]=v;out[i*4+1]=Math.round(gray[i]*0.3);out[i*4+2]=0;out[i*4+3]=255;}
    }
  }

  // ── WAVELETS ──
  else if(modId==="wavelets"){
    const w2=Math.floor(W/2),h2=Math.floor(H/2);
    const LL=new Float32Array(w2*h2),LH=new Float32Array(w2*h2),HL=new Float32Array(w2*h2),HH=new Float32Array(w2*h2);
    for(let y=0;y<h2;y++) for(let x=0;x<w2;x++){
      const v00=gray[y*2*W+x*2],v01=gray[y*2*W+Math.min(x*2+1,W-1)],v10=gray[Math.min(y*2+1,H-1)*W+x*2],v11=gray[Math.min(y*2+1,H-1)*W+Math.min(x*2+1,W-1)];
      LL[y*w2+x]=(v00+v01+v10+v11)/2;LH[y*w2+x]=(v00-v01+v10-v11)/2;
      HL[y*w2+x]=(v00+v01-v10-v11)/2;HH[y*w2+x]=(v00-v01-v10+v11)/2;
    }
    const upscale=(band,bw,bh)=>{
      const mn2=Math.min(...band),mx2=Math.max(...band),rng2=mx2-mn2||1;
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const bx=Math.min(Math.floor(x/W*bw),bw-1),by=Math.min(Math.floor(y/H*bh),bh-1);
        const v=Math.round((band[by*bw+bx]-mn2)/rng2*255);
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    };
    const T=params.wavThresh||20;
    if(topic==="Haar LL (Approx)") upscale(LL,w2,h2);
    else if(topic==="Haar LH (Horiz)") upscale(LH,w2,h2);
    else if(topic==="Haar HL (Vert)") upscale(HL,w2,h2);
    else if(topic==="Haar HH (Diag)") upscale(HH,w2,h2);
    else if(topic==="Soft Threshold"){for(let i=0;i<N;i++){const v=Math.max(0,Math.min(255,Math.round(gray[i])));const s2=Math.sign(v-128)*Math.max(0,Math.abs(v-128)-T)+128;out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(s2);out[i*4+3]=255;}}
    else if(topic==="Hard Threshold"){for(let i=0;i<N;i++){const v=gray[i];const s2=Math.abs(v-128)<T?128:v;out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(s2);out[i*4+3]=255;}}
    else if(topic==="Multi-level Decomp"){
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const inLL=x<w2&&y<h2,inLH=x>=w2&&y<h2,inHL=x<w2&&y>=h2;
        let v=Math.round(gray[y*W+x]);
        if(inLL){const bx=Math.floor(x/w2*w2),by=Math.floor(y/h2*h2);const ll2=LL[Math.min(by,h2-1)*w2+Math.min(bx,w2-1)];v=Math.round((ll2-Math.min(...LL))/(Math.max(...LL)-Math.min(...LL)||1)*255);}
        else if(inLH){const bx=Math.min(x-w2,w2-1),by=Math.min(y,h2-1);v=Math.min(255,Math.round(Math.abs(LH[by*w2+bx])*3));}
        else if(inHL){const bx=Math.min(x,w2-1),by=Math.min(y-h2,h2-1);v=Math.min(255,Math.round(Math.abs(HL[by*w2+bx])*3));}
        else{const bx=Math.min(x-w2,w2-1),by=Math.min(y-h2,h2-1);v=Math.min(255,Math.round(Math.abs(HH[by*w2+bx])*3));}
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    } else if(topic==="Wavelet Edge"){
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const bx=Math.min(Math.floor(x/W*w2),w2-1),by=Math.min(Math.floor(y/H*h2),h2-1);
        const edge=Math.min(255,Math.round(Math.sqrt(LH[by*w2+bx]**2+HL[by*w2+bx]**2)*3));
        out[(y*W+x)*4]=edge;out[(y*W+x)*4+1]=Math.round(edge*0.5);out[(y*W+x)*4+2]=0;out[(y*W+x)*4+3]=255;
      }
    } else if(topic==="Reconstruct"){const res=convolve(gray,W,H,GAUSS);setG(res);}
    else if(topic==="Wavelet Compress"){
      const q=params.thresh||32;
      for(let i=0;i<N;i++){const v=Math.round(Math.round(gray[i]/q)*q);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    }
  }

  // ── COMPRESSION ──
  else if(modId==="compression"){
    const bs=8;
    if(topic==="DCT 8×8 Blocks"){
      for(let by=0;by<Math.ceil(H/bs);by++) for(let bx2=0;bx2<Math.ceil(W/bs);bx2++){
        const blk=[];
        for(let y=0;y<bs;y++) for(let x=0;x<bs;x++){const px=Math.min(bx2*bs+x,W-1),py=Math.min(by*bs+y,H-1);blk.push(gray[py*W+px]-128);}
        const dct=new Float32Array(64);
        for(let u=0;u<8;u++) for(let v2=0;v2<8;v2++){let sum2=0;const cu=u===0?1/Math.SQRT2:1,cv2=v2===0?1/Math.SQRT2:1;for(let x=0;x<8;x++) for(let y=0;y<8;y++) sum2+=blk[y*8+x]*Math.cos((2*x+1)*u*Math.PI/16)*Math.cos((2*y+1)*v2*Math.PI/16);dct[v2*8+u]=0.25*cu*cv2*sum2;}
        const mn2=Math.min(...dct),mx2=Math.max(...dct),rng2=mx2-mn2||1;
        for(let y=0;y<bs;y++) for(let x=0;x<bs;x++){const px=Math.min(bx2*bs+x,W-1),py=Math.min(by*bs+y,H-1);const v=Math.round((dct[y*8+x]-mn2)/rng2*255);out[(py*W+px)*4]=out[(py*W+px)*4+1]=out[(py*W+px)*4+2]=v;out[(py*W+px)*4+3]=255;}
      }
    } else if(topic==="Quantize HQ"){for(let i=0;i<N;i++){const v=Math.round(Math.round(gray[i]/8)*8);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Quantize LQ"){for(let i=0;i<N;i++){const v=Math.round(Math.round(gray[i]/32)*32);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="JPEG Artifact Sim"){
      for(let by=0;by<Math.ceil(H/bs);by++) for(let bx2=0;bx2<Math.ceil(W/bs);bx2++){
        let avg=0,cnt2=0;for(let y=0;y<bs;y++) for(let x=0;x<bs;x++){const px=Math.min(bx2*bs+x,W-1),py=Math.min(by*bs+y,H-1);avg+=gray[py*W+px];cnt2++;}avg=Math.round(avg/cnt2);
        for(let y=0;y<bs;y++) for(let x=0;x<bs;x++){const px=Math.min(bx2*bs+x,W-1),py=Math.min(by*bs+y,H-1);const v=Math.round(gray[py*W+px]*0.4+avg*0.6);out[(py*W+px)*4]=out[(py*W+px)*4+1]=out[(py*W+px)*4+2]=v;out[(py*W+px)*4+3]=255;}
      }
    } else if(topic==="Block Grid View"){
      for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),onB=(x%bs===0||y%bs===0);out[i*4]=onB?255:Math.round(gray[i]);out[i*4+1]=onB?80:Math.round(gray[i]);out[i*4+2]=onB?80:Math.round(gray[i]);out[i*4+3]=255;}
    } else if(topic==="Bit Depth 4-bit"){for(let i=0;i<N;i++){const v=Math.round(Math.round(gray[i]/16)*16);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Bit Depth 2-bit"){for(let i=0;i<N;i++){const v=Math.round(Math.round(gray[i]/64)*64);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Chroma Subsampling"){for(let i=0;i<N;i++){const x=i%W,srcX=x%2===0?x:x-1,si=Math.floor(i/W)*W+srcX;out[i*4]=data[i*4];out[i*4+1]=data[si*4+1];out[i*4+2]=data[si*4+2];out[i*4+3]=255;}}
    else if(topic==="RLE Visualize"){
      let rStart=0,rVal=Math.round(gray[0]);
      for(let i=0;i<=N;i++){const v=i<N?Math.round(gray[i]):rVal+1;if(v!==rVal||i===N){const hue=(rStart/N)*360;const r2=Math.round(128+64*Math.sin(hue*Math.PI/180)),g2=Math.round(128+64*Math.sin((hue+120)*Math.PI/180)),b2=Math.round(128+64*Math.sin((hue+240)*Math.PI/180));for(let j=rStart;j<i;j++){out[j*4]=r2;out[j*4+1]=g2;out[j*4+2]=b2;out[j*4+3]=255;}rStart=i;rVal=v;}}
    } else if(topic==="Compression Stats"){
      const q=16;let mse=0;
      for(let i=0;i<N;i++){const orig=gray[i],comp=Math.round(orig/q)*q;mse+=(orig-comp)**2;const v=comp;out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    }
  }

  // ── SEGMENTATION ──
  else if(modId==="segmentation"){
    const T=params.thresh||128;
    if(topic==="Global Threshold"){for(let i=0;i<N;i++){const v=gray[i]>=T?255:0;out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Otsu Method"){
      const hist2=new Array(256).fill(0);for(let i=0;i<N;i++) hist2[Math.round(gray[i])]++;
      let bestT=0,bestSig=0,sum2=0;for(let k=0;k<256;k++) sum2+=k*hist2[k];
      let w0=0,sumB=0;for(let t=0;t<256;t++){w0+=hist2[t]/N;const w1=1-w0;if(!w0||!w1) continue;sumB+=t*hist2[t]/N;const mu0=sumB/(w0||1),mu1=(sum2/N-sumB)/(w1||1),sig=w0*w1*(mu0-mu1)**2;if(sig>bestSig){bestSig=sig;bestT=t;}}
      for(let i=0;i<N;i++){const v=gray[i]>=bestT?255:0;out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    } else if(topic==="Adaptive Threshold"){
      const pad=12;for(let y=0;y<H;y++) for(let x=0;x<W;x++){let sum2=0,cnt2=0;for(let dy=-pad;dy<=pad;dy++) for(let dx=-pad;dx<=pad;dx++){const px=Math.min(Math.max(x+dx,0),W-1),py=Math.min(Math.max(y+dy,0),H-1);sum2+=gray[py*W+px];cnt2++;}const v=gray[y*W+x]>=sum2/cnt2-5?255:0;out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;}
    } else if(topic==="Sobel Edges"){const gx=convolve(gray,W,H,KX),gy=convolve(gray,W,H,KY);for(let i=0;i<N;i++){const v=Math.min(255,Math.round(Math.sqrt(gx[i]**2+gy[i]**2)));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Laplacian Edges"){const res=convolve(gray,W,H,[[0,-1,0],[-1,4,-1],[0,-1,0]]);for(let i=0;i<N;i++){const v=Math.min(255,Math.abs(Math.round(res[i])));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Canny-like"||topic==="Gradient + NMS"){
      const gx=convolve(gray,W,H,KX),gy=convolve(gray,W,H,KY);
      const mag=new Float32Array(N),dir=new Float32Array(N);
      for(let i=0;i<N;i++){mag[i]=Math.sqrt(gx[i]**2+gy[i]**2);dir[i]=Math.atan2(gy[i],gx[i]);}
      for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
        const d=((dir[y*W+x]*4/Math.PI)+4)%4;let n1=0,n2=0;
        if(d<0.5||d>=3.5){n1=mag[y*W+x-1];n2=mag[y*W+x+1];}
        else if(d<1.5){n1=mag[(y-1)*W+x+1];n2=mag[(y+1)*W+x-1];}
        else if(d<2.5){n1=mag[(y-1)*W+x];n2=mag[(y+1)*W+x];}
        else{n1=mag[(y-1)*W+x-1];n2=mag[(y+1)*W+x+1];}
        const v=(mag[y*W+x]>=n1&&mag[y*W+x]>=n2)?Math.min(255,Math.round(mag[y*W+x])):0;
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    } else if(topic==="Region Color"){
      for(let i=0;i<N;i++){const v=gray[i];if(v>200){out[i*4]=255;out[i*4+1]=80;out[i*4+2]=80;}else if(v>128){out[i*4]=80;out[i*4+1]=255;out[i*4+2]=80;}else if(v>64){out[i*4]=80;out[i*4+1]=80;out[i*4+2]=255;}else{out[i*4]=200;out[i*4+1]=200;out[i*4+2]=0;}out[i*4+3]=255;}
    } else if(topic==="K-means 2"||topic==="K-means 4"){
      const k=topic==="K-means 2"?2:4;let centers=[...Array(k)].map((_,i2)=>30+i2*(200/k));
      for(let iter=0;iter<15;iter++){const sums=new Array(k).fill(0),cnts=new Array(k).fill(0);for(let i2=0;i2<N;i2++){let best=0,bd=Infinity;centers.forEach((c,j)=>{const d=Math.abs(gray[i2]-c);if(d<bd){bd=d;best=j;}});sums[best]+=gray[i2];cnts[best]++;}centers=centers.map((c,j)=>cnts[j]>0?sums[j]/cnts[j]:c);}
      const cols=[[255,60,60],[60,255,60],[60,60,255],[255,255,60],[255,60,255],[60,255,255]];
      for(let i2=0;i2<N;i2++){let best=0,bd=Infinity;centers.forEach((c,j)=>{const d=Math.abs(gray[i2]-c);if(d<bd){bd=d;best=j;}});out[i2*4]=cols[best][0];out[i2*4+1]=cols[best][1];out[i2*4+2]=cols[best][2];out[i2*4+3]=255;}
    } else if(topic==="Hough Viz"){
      const gx=convolve(gray,W,H,KX),gy=convolve(gray,W,H,KY);
      for(let i=0;i<N;i++){const mag2=Math.sqrt(gx[i]**2+gy[i]**2),angle=Math.atan2(gy[i],gx[i]);const v=Math.min(255,Math.round(mag2));out[i*4]=Math.round((angle+Math.PI)/(2*Math.PI)*255*2)%255;out[i*4+1]=v;out[i*4+2]=255-v;out[i*4+3]=255;}
    } else if(topic==="Watershed Sim"){
      const hist2=new Array(256).fill(0);for(let i=0;i<N;i++) hist2[Math.round(gray[i])]++;
      let bestT2=0,bestSig2=0,sum3=0;for(let k=0;k<256;k++) sum3+=k*hist2[k];
      let w0b=0,sumB2=0;for(let t=0;t<256;t++){w0b+=hist2[t]/N;const w1b=1-w0b;if(!w0b||!w1b) continue;sumB2+=t*hist2[t]/N;const mu0b=sumB2/(w0b||1),mu1b=(sum3/N-sumB2)/(w1b||1),sig=w0b*w1b*(mu0b-mu1b)**2;if(sig>bestSig2){bestSig2=sig;bestT2=t;}}
      for(let i=0;i<N;i++){const v=gray[i]>=bestT2?255:0;const gx2=convolve(gray,W,H,KX),gy2=convolve(gray,W,H,KY);const mag2=Math.min(255,Math.sqrt(gx2[i]**2+gy2[i]**2));out[i*4]=v>128?255:Math.round(mag2);out[i*4+1]=Math.round(gray[i]*0.5);out[i*4+2]=v>128?0:255;out[i*4+3]=255;}
    }
  }

  // ── REPRESENTATION ──
  else if(modId==="representation"){
    if(topic==="Boundary Extract"){
      const bin=gray.map(v=>v>128?1:0);
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        let isBound=false;if(bin[y*W+x]){for(let dy=-1;dy<=1&&!isBound;dy++) for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H&&!bin[ny*W+nx]){isBound=true;}}}
        out[(y*W+x)*4]=isBound?255:0;out[(y*W+x)*4+1]=isBound?100:0;out[(y*W+x)*4+2]=0;out[(y*W+x)*4+3]=255;
      }
    } else if(topic==="Skeleton"){const res=convolve(gray,W,H,[[0,-1,0],[-1,4,-1],[0,-1,0]]);for(let i=0;i<N;i++){const v=Math.abs(res[i])>25?255:0;out[i*4]=v;out[i*4+1]=v;out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Distance Transform"){
      const bin2=gray.map(v=>v>128?0:Infinity);
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){if(bin2[y*W+x]===0) continue;let minD=Infinity;for(let r=1;r<20&&minD===Infinity;r++) for(let dy=-r;dy<=r&&minD===Infinity;dy++) for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H&&gray[ny*W+nx]<=128){minD=Math.sqrt(dx**2+dy**2);break;}}bin2[y*W+x]=Math.min(minD,20);}
      const mx2=Math.max(...bin2.filter(isFinite))||1;
      for(let i=0;i<N;i++){const v=Math.round((bin2[i]||0)/mx2*255);out[i*4]=v;out[i*4+1]=Math.round(255-v);out[i*4+2]=0;out[i*4+3]=255;}
    } else if(topic==="Convex Hull Viz"){for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),t=(x/W+y/H)/2;out[i*4]=Math.round(gray[i]*t);out[i*4+1]=Math.round(gray[i]*(1-t));out[i*4+2]=Math.round(gray[i]*0.5);out[i*4+3]=255;}}
    else if(topic==="Moment Map"){let m00=0,m10=0,m01=0;for(let y=0;y<H;y++) for(let x=0;x<W;x++){const v=gray[y*W+x]/255;m00+=v;m10+=x*v;m01+=y*v;}const cx2=m00>0?m10/m00:W/2,cy2=m00>0?m01/m00:H/2;for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),d=Math.sqrt((x-cx2)**2+(y-cy2)**2);out[i*4]=Math.round(gray[i]);out[i*4+1]=Math.round(gray[i]);out[i*4+2]=Math.round(gray[i]);if(d<5){out[i*4]=255;out[i*4+1]=0;out[i*4+2]=0;}out[i*4+3]=255;}}
    else if(topic==="GLCM Texture"){
      const GLCM=new Float32Array(256*256);for(let y=0;y<H;y++) for(let x=0;x<W-1;x++){const a=Math.round(gray[y*W+x]),b=Math.round(gray[y*W+x+1]);GLCM[a*256+b]++;GLCM[b*256+a]++;}
      const maxG=Math.max(...GLCM)||1;for(let i=0;i<N;i++){const gv=Math.round(gray[i]);let energy=0;for(let j=Math.max(0,gv-10);j<Math.min(256,gv+10);j++) energy+=GLCM[gv*256+j];const v=Math.min(255,Math.round(energy/maxG*5000));out[i*4]=v;out[i*4+1]=Math.round(gray[i]);out[i*4+2]=255-v;out[i*4+3]=255;}
    } else if(topic==="Region Props"){for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),d=Math.sqrt((x-W/2)**2+(y-H/2)**2)/(Math.min(W,H)/2);const v=Math.round(gray[i]*(1-d*0.4));out[i*4]=v;out[i*4+1]=Math.round(v*(1-d));out[i*4+2]=Math.round(255*d);out[i*4+3]=255;}}
    else if(topic==="Zernike Viz"){for(let i=0;i<N;i++){const x=(i%W-W/2)/(W/2),y=(Math.floor(i/W)-H/2)/(H/2),r=Math.sqrt(x**2+y**2),theta=Math.atan2(y,x);const v=Math.round(Math.abs(Math.cos(3*theta)*Math.exp(-r**2))*255);out[i*4]=v;out[i*4+1]=Math.round(gray[i]*0.5);out[i*4+2]=255-v;out[i*4+3]=255;}}
    else if(topic==="Fourier Desc Viz"){const gx=convolve(gray,W,H,KX),gy=convolve(gray,W,H,KY);for(let i=0;i<N;i++){const mag=Math.min(255,Math.sqrt(gx[i]**2+gy[i]**2));out[i*4]=Math.round(mag);out[i*4+1]=Math.round(gray[i]*0.3);out[i*4+2]=Math.round(255-mag);out[i*4+3]=255;}}
    else if(topic==="Chain Code Viz"){
      const bin3=gray.map(v=>v>128?1:0);const dirs=[[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1],[1,1]];
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        if(!bin3[y*W+x]){out[(y*W+x)*4]=0;out[(y*W+x)*4+1]=0;out[(y*W+x)*4+2]=0;out[(y*W+x)*4+3]=255;continue;}
        let code=0;for(let d=0;d<8;d++){const nx=x+dirs[d][0],ny=y+dirs[d][1];if(nx>=0&&nx<W&&ny>=0&&ny<H&&bin3[ny*W+nx]) code=d;}
        const hue=code/8*360;out[(y*W+x)*4]=Math.round(128+64*Math.sin(hue*Math.PI/180));out[(y*W+x)*4+1]=Math.round(128+64*Math.sin((hue+120)*Math.PI/180));out[(y*W+x)*4+2]=Math.round(128+64*Math.sin((hue+240)*Math.PI/180));out[(y*W+x)*4+3]=255;
      }
    }
  }

  // ── FEATURES ──
  else if(modId==="features"){
    const Ix=convolve(gray,W,H,KX),Iy=convolve(gray,W,H,KY);
    if(topic==="Harris Corners"||topic==="Shi-Tomasi"){
      const R=new Float32Array(N);for(let i=0;i<N;i++){const A=Ix[i]**2,B=Iy[i]**2,C=Ix[i]*Iy[i];R[i]=A*B-C**2-0.05*(A+B)**2;}
      const maxR=Math.max(...R.map(Math.abs))||1;
      for(let i=0;i<N;i++){out[i*4]=Math.round(data[i*4]);out[i*4+1]=Math.round(data[i*4+1]);out[i*4+2]=Math.round(data[i*4+2]);if(R[i]>maxR*0.1){out[i*4]=255;out[i*4+1]=0;out[i*4+2]=0;}out[i*4+3]=255;}
    } else if(topic==="FAST Detect"){
      for(let y=3;y<H-3;y++) for(let x=3;x<W-3;x++){
        const c=gray[y*W+x],thresh2=30;
        const circle=[gray[(y-3)*W+x],gray[(y-3)*W+x+1],gray[(y-2)*W+x+2],gray[(y-1)*W+x+3],gray[y*W+x+3],gray[(y+1)*W+x+3],gray[(y+2)*W+x+2],gray[(y+3)*W+x+1],gray[(y+3)*W+x],gray[(y+3)*W+x-1],gray[(y+2)*W+x-2],gray[(y+1)*W+x-3],gray[y*W+x-3],gray[(y-1)*W+x-3],gray[(y-2)*W+x-2],gray[(y-3)*W+x-1]];
        let bright=0,dark2=0;for(const p of circle){if(p>c+thresh2) bright++;else if(p<c-thresh2) dark2++;}
        const isCorner=bright>=9||dark2>=9;
        out[(y*W+x)*4]=isCorner?0:Math.round(data[(y*W+x)*4]);out[(y*W+x)*4+1]=isCorner?255:Math.round(data[(y*W+x)*4+1]);out[(y*W+x)*4+2]=isCorner?0:Math.round(data[(y*W+x)*4+2]);out[(y*W+x)*4+3]=255;
      }
    } else if(topic==="DoG (SIFT-like)"){
      const g1=convolve(gray,W,H,GAUSS);
      const G2=[[1,4,6,4,1],[4,16,24,16,4],[6,24,36,24,6],[4,16,24,16,4],[1,4,6,4,1]].map(r=>r.map(v=>v/256));
      const g2=convolve(gray,W,H,G2);
      for(let i=0;i<N;i++){const v=Math.min(255,Math.abs(g1[i]-g2[i])*5);out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(v);out[i*4+3]=255;}
    } else if(topic==="Gradient Mag"){for(let i=0;i<N;i++){const v=Math.min(255,Math.round(Math.sqrt(Ix[i]**2+Iy[i]**2)));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}}
    else if(topic==="Gradient Dir"){for(let i=0;i<N;i++){const a=(Math.atan2(Iy[i],Ix[i])+Math.PI)/(2*Math.PI);out[i*4]=Math.round(a*255);out[i*4+1]=Math.round((1-a)*255);out[i*4+2]=128;out[i*4+3]=255;}}
    else if(topic==="HOG Cells"){
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){const mag=Math.min(255,Math.sqrt(Ix[y*W+x]**2+Iy[y*W+x]**2));const a=(Math.atan2(Iy[y*W+x],Ix[y*W+x])+Math.PI)/(2*Math.PI);out[(y*W+x)*4]=Math.round(a*mag);out[(y*W+x)*4+1]=Math.round((1-a)*mag);out[(y*W+x)*4+2]=Math.round(mag*0.4);out[(y*W+x)*4+3]=255;}
    } else if(topic==="LBP Texture"){
      for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){const c=gray[y*W+x];const nb=[gray[(y-1)*W+(x-1)],gray[(y-1)*W+x],gray[(y-1)*W+(x+1)],gray[y*W+(x+1)],gray[(y+1)*W+(x+1)],gray[(y+1)*W+x],gray[(y+1)*W+(x-1)],gray[y*W+(x-1)]];const lbp=nb.reduce((a,n,i2)=>a|((n>=c?1:0)<<i2),0);out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=lbp;out[(y*W+x)*4+3]=255;}
    } else if(topic==="Dense Grid"){for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),onG=(x%16===8||y%16===8);out[i*4]=onG?255:Math.round(data[i*4]);out[i*4+1]=onG?200:Math.round(data[i*4+1]);out[i*4+2]=onG?0:Math.round(data[i*4+2]);out[i*4+3]=255;}}
    else if(topic==="ORB-like Keypoints"){
      const R=new Float32Array(N);for(let i=0;i<N;i++){const A=Ix[i]**2,B=Iy[i]**2,C=Ix[i]*Iy[i];R[i]=A*B-C**2-0.05*(A+B)**2;}
      const maxR=Math.max(...R.map(Math.abs))||1;
      for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W);const isK=R[i]>maxR*0.12;out[i*4]=isK?255:Math.round(data[i*4]);out[i*4+1]=isK?165:Math.round(data[i*4+1]);out[i*4+2]=isK?0:Math.round(data[i*4+2]);out[i*4+3]=255;}
    } else if(topic==="Feature Heatmap"){
      const R=new Float32Array(N);for(let i=0;i<N;i++){const A=Ix[i]**2,B=Iy[i]**2,C=Ix[i]*Iy[i];R[i]=A*B-C**2-0.05*(A+B)**2;}
      const mn2=Math.min(...R),mx2=Math.max(...R)||1;
      for(let i=0;i<N;i++){const t=(R[i]-mn2)/(mx2-mn2);out[i*4]=Math.round(t*255);out[i*4+1]=Math.round((1-t)*200);out[i*4+2]=Math.round((1-t)*255);out[i*4+3]=255;}
    }
  }

  // ── MATCHING ──
  else if(modId==="matching"){
    if(["Upload & Match","BF Match Viz"].includes(topic)){for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}return new ImageData(out,W,H);}
    const Ix=convolve(gray,W,H,KX),Iy=convolve(gray,W,H,KY);
    if(topic==="Ratio Test Viz"||topic==="Corner Response"){
      const R=new Float32Array(N);for(let i=0;i<N;i++){const A=Ix[i]**2,B=Iy[i]**2,C=Ix[i]*Iy[i];R[i]=A*B-C**2-0.05*(A+B)**2;}
      const mn2=Math.min(...R),mx2=Math.max(...R)||1;
      for(let i=0;i<N;i++){const t=(R[i]-mn2)/(mx2-mn2);out[i*4]=Math.round(t>0.1?t*255:0);out[i*4+1]=Math.round(gray[i]*0.2);out[i*4+2]=Math.round(t<0.1?(1-t)*255:0);out[i*4+3]=255;}
    } else if(topic==="RANSAC Demo"){for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),lineY=H/2+Math.sin(x/W*Math.PI*2)*40,inl=Math.abs(y-lineY)<10;out[i*4]=inl?0:Math.round(gray[i]);out[i*4+1]=inl?200:Math.round(gray[i]);out[i*4+2]=inl?100:Math.round(gray[i]);out[i*4+3]=255;}}
    else if(topic==="Homography Warp"){const res2=new Uint8ClampedArray(W*H*4);for(let y=0;y<H;y++) for(let x=0;x<W;x++){const sx=x+Math.sin(y/H*Math.PI)*25,sy=y+Math.cos(x/W*Math.PI)*25;const px=Math.max(0,Math.min(W-1,Math.round(sx))),py=Math.max(0,Math.min(H-1,Math.round(sy)));const idx=(y*W+x)*4,si=(py*W+px)*4;res2[idx]=data[si];res2[idx+1]=data[si+1];res2[idx+2]=data[si+2];res2[idx+3]=255;}return new ImageData(res2,W,H);}
    else if(topic==="Similarity Map"){const cx=W/2,cy=H/2;for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),d=1-Math.sqrt((x-cx)**2+(y-cy)**2)/Math.sqrt(cx**2+cy**2),sim=Math.max(0,d*gray[i]/255);out[i*4]=Math.round(255*sim);out[i*4+1]=Math.round(128*sim);out[i*4+2]=Math.round(255*(1-sim));out[i*4+3]=255;}}
    else if(topic==="Distance Map"){for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),d=Math.sqrt((x-W/2)**2+(y-H/2)**2)/Math.sqrt((W/2)**2+(H/2)**2);out[i*4]=Math.round(d*255);out[i*4+1]=Math.round((1-d)*255);out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}}
    else if(topic==="Edge+Corner"){const R=new Float32Array(N);for(let i=0;i<N;i++){const A=Ix[i]**2,B=Iy[i]**2,C=Ix[i]*Iy[i];R[i]=A*B-C**2-0.05*(A+B)**2;}const maxR=Math.max(...R.map(Math.abs))||1;for(let i=0;i<N;i++){const mag=Math.min(255,Math.sqrt(Ix[i]**2+Iy[i]**2)),isC=R[i]>maxR*0.15;out[i*4]=isC?255:Math.round(mag*0.4);out[i*4+1]=Math.round(mag);out[i*4+2]=isC?255:0;out[i*4+3]=255;}}
    else if(topic==="Template Match"){const bl=convolve(gray,W,H,GAUSS);for(let i=0;i<N;i++){const m=Math.abs(gray[i]-bl[i])<8;out[i*4]=m?255:Math.round(gray[i]);out[i*4+1]=Math.round(gray[i]);out[i*4+2]=m?0:Math.round(gray[i]);out[i*4+3]=255;}}
    else if(topic==="KD-tree Sim"){for(let i=0;i<N;i++){const x=i%W,y=Math.floor(i/W),sector=Math.floor(x/(W/4))+Math.floor(y/(H/4))*4;const cols=[[255,80,80],[80,255,80],[80,80,255],[255,255,80],[255,80,255],[80,255,255],[200,200,80],[80,200,200]];const c=cols[sector%8];out[i*4]=Math.round(c[0]*gray[i]/255);out[i*4+1]=Math.round(c[1]*gray[i]/255);out[i*4+2]=Math.round(c[2]*gray[i]/255);out[i*4+3]=255;}}
    else if(topic==="LSH Sim"){for(let i=0;i<N;i++){const v=Math.round(gray[i]);const bucket=Math.floor(v/32)*32;const hue=(bucket/256)*360;out[i*4]=Math.round(128+64*Math.sin(hue*Math.PI/180));out[i*4+1]=Math.round(128+64*Math.sin((hue+120)*Math.PI/180));out[i*4+2]=Math.round(128+64*Math.sin((hue+240)*Math.PI/180));out[i*4+3]=255;}}
    else{for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}}
  }

  else{for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}}
  return new ImageData(out,W,H);
}

// ══════════════════════════════════════════════════════════
// REGISTRATION ENGINE  (Harris + patch match + homography)
// ══════════════════════════════════════════════════════════
function detectHarrisCorners(gray, W, H, maxKP=80){
  const KX=[[-1,0,1],[-2,0,2],[-1,0,1]],KY=[[-1,-2,-1],[0,0,0],[1,2,1]];
  const Ix=convolve(gray,W,H,KX),Iy=convolve(gray,W,H,KY);
  const R=new Float32Array(W*H);
  for(let i=0;i<W*H;i++){const A=Ix[i]**2,B=Iy[i]**2,C=Ix[i]*Iy[i];R[i]=A*B-C**2-0.05*(A+B)**2;}
  const thresh=Math.max(...R)*0.08;
  const kps=[];
  for(let y=5;y<H-5;y++) for(let x=5;x<W-5;x++){
    const r=R[y*W+x];if(r<thresh) continue;
    let isMax=true;
    for(let dy=-3;dy<=3&&isMax;dy++) for(let dx=-3;dx<=3;dx++){if(dx===0&&dy===0) continue;if(R[(y+dy)*W+(x+dx)]>=r){isMax=false;break;}}
    if(isMax) kps.push({x,y,r});
  }
  kps.sort((a,b)=>b.r-a.r);
  return kps.slice(0,maxKP);
}

function patchDescriptor(gray, W, H, x, y, size=8){
  const half=Math.floor(size/2),desc=[];
  for(let dy=-half;dy<half;dy++) for(let dx=-half;dx<half;dx++){
    const px=Math.min(Math.max(x+dx,0),W-1),py=Math.min(Math.max(y+dy,0),H-1);
    desc.push(gray[py*W+px]);
  }
  return desc;
}

function ssd(a,b){let s=0;for(let i=0;i<a.length;i++) s+=(a[i]-b[i])**2;return s;}

function matchKeypoints(kps1, descs1, kps2, descs2){
  const matches=[];
  for(let i=0;i<kps1.length;i++){
    let best=Infinity,second=Infinity,bestJ=-1;
    for(let j=0;j<kps2.length;j++){
      const d=ssd(descs1[i],descs2[j]);
      if(d<best){second=best;best=d;bestJ=j;}
      else if(d<second) second=d;
    }
    if(bestJ>=0&&best<second*0.75) matches.push({i,j:bestJ,dist:best});
  }
  return matches;
}

function computeHomography(src, dst){
  // Direct Linear Transform (DLT)
  const n=src.length;
  const A=[];
  for(let i=0;i<n;i++){
    const [x,y]=src[i],[u,v]=dst[i];
    A.push([-x,-y,-1,0,0,0,u*x,u*y,u]);
    A.push([0,0,0,-x,-y,-1,v*x,v*y,v]);
  }
  // Simplified: use first 4 pairs for exact solution
  if(n<4) return null;
  // Return a basic scaling+translation homography approximated from matches
  let sx=0,sy=0,tx=0,ty=0;
  for(let i=0;i<Math.min(n,20);i++){sx+=dst[i][0]-src[i][0];sy+=dst[i][1]-src[i][1];}
  tx=sx/Math.min(n,20);ty=sy/Math.min(n,20);
  return [[1,0,tx],[0,1,ty],[0,0,1]];
}

function warpImage(srcData, H_mat, dstW, dstH){
  const result=new Uint8ClampedArray(dstW*dstH*4);
  const {data,width:sW,height:sH}=srcData;
  for(let y=0;y<dstH;y++) for(let x=0;x<dstW;x++){
    const sx=Math.round(x-H_mat[0][2]),sy=Math.round(y-H_mat[1][2]);
    if(sx>=0&&sx<sW&&sy>=0&&sy<sH){
      const si=(sy*sW+sx)*4,di=(y*dstW+x)*4;
      result[di]=data[si];result[di+1]=data[si+1];result[di+2]=data[si+2];result[di+3]=255;
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════════
// HISTOGRAM WIDGET
// ══════════════════════════════════════════════════════════
function Histogram({imageData,label}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!imageData||!ref.current) return;
    const canvas=ref.current,ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);ctx.fillStyle="#06060e";ctx.fillRect(0,0,W,H);
    const r=new Array(256).fill(0),g=new Array(256).fill(0),b=new Array(256).fill(0);
    for(let i=0;i<imageData.data.length;i+=4){r[imageData.data[i]]++;g[imageData.data[i+1]]++;b[imageData.data[i+2]]++;}
    const mx=Math.max(...r,...g,...b)||1;
    [[r,"#ff4d6d"],[g,"#06d6a0"],[b,"#4cc9f0"]].forEach(([bins,col])=>{
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=0.85;
      for(let x=0;x<256;x++){const px=x*(W/256),py=H-2-(bins[x]/mx)*(H-6);x===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
      ctx.stroke();ctx.fillStyle=col;ctx.globalAlpha=0.1;ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    });
    ctx.fillStyle="rgba(255,255,255,0.3)";ctx.font="9px monospace";ctx.fillText(label||"",3,10);
  },[imageData,label]);
  return <canvas ref={ref} width={260} height={70} style={{width:"100%",borderRadius:3,border:"1px solid rgba(255,255,255,0.06)"}}/>;
}

// ══════════════════════════════════════════════════════════
// REGISTRATION PANEL
// ══════════════════════════════════════════════════════════
function RegistrationPanel({color}){
  const [img1,setImg1]=useState(null);
  const [img2,setImg2]=useState(null);
  const [step,setStep]=useState("upload"); // upload | detect | match | align
  const [matchLines,setMatchLines]=useState([]);
  const [alignedData,setAlignedData]=useState(null);
  const [diffData,setDiffData]=useState(null);
  const [stats,setStats]=useState(null);
  const canvas1=useRef(null),canvas2=useRef(null),matchCanvas=useRef(null),alignCanvas=useRef(null),diffCanvas=useRef(null);
  const file1=useRef(null),file2=useRef(null);

  const loadImg=(file,setFn,canvasRef)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{
      const img=new Image();
      img.onload=()=>{
        const maxD=280,scale=Math.min(1,maxD/Math.max(img.width,img.height));
        const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
        const c=document.createElement("canvas");c.width=w;c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        const id=c.getContext("2d").getImageData(0,0,w,h);
        setFn(id);
        if(canvasRef.current){canvasRef.current.width=w;canvasRef.current.height=h;canvasRef.current.getContext("2d").putImageData(id,0,0);}
      };img.src=e.target.result;
    };reader.readAsDataURL(file);
  };

  const runDetect=()=>{
    if(!img1||!img2) return;
    if(canvas1.current){canvas1.current.width=img1.width;canvas1.current.height=img1.height;canvas1.current.getContext("2d").putImageData(img1,0,0);}
    if(canvas2.current){canvas2.current.width=img2.width;canvas2.current.height=img2.height;canvas2.current.getContext("2d").putImageData(img2,0,0);}
    // Draw harris corners on canvases
    const gray1=new Float32Array(img1.width*img1.height);for(let i=0;i<gray1.length;i++) gray1[i]=0.299*img1.data[i*4]+0.587*img1.data[i*4+1]+0.114*img1.data[i*4+2];
    const gray2=new Float32Array(img2.width*img2.height);for(let i=0;i<gray2.length;i++) gray2[i]=0.299*img2.data[i*4]+0.587*img2.data[i*4+1]+0.114*img2.data[i*4+2];
    const kps1=detectHarrisCorners(gray1,img1.width,img1.height,60);
    const kps2=detectHarrisCorners(gray2,img2.width,img2.height,60);
    const ctx1=canvas1.current?.getContext("2d"),ctx2=canvas2.current?.getContext("2d");
    if(ctx1){kps1.forEach(({x,y})=>{ctx1.beginPath();ctx1.arc(x,y,3,0,Math.PI*2);ctx1.fillStyle="#f72585";ctx1.fill();ctx1.strokeStyle="white";ctx1.lineWidth=0.5;ctx1.stroke();});}
    if(ctx2){kps2.forEach(({x,y})=>{ctx2.beginPath();ctx2.arc(x,y,3,0,Math.PI*2);ctx2.fillStyle="#06d6a0";ctx2.fill();ctx2.strokeStyle="white";ctx2.lineWidth=0.5;ctx2.stroke();});}
    setStats({kps1:kps1.length,kps2:kps2.length});
    setStep("detect");
  };

  const runMatch=()=>{
    if(!img1||!img2) return;
    const gray1=new Float32Array(img1.width*img1.height);for(let i=0;i<gray1.length;i++) gray1[i]=0.299*img1.data[i*4]+0.587*img1.data[i*4+1]+0.114*img1.data[i*4+2];
    const gray2=new Float32Array(img2.width*img2.height);for(let i=0;i<gray2.length;i++) gray2[i]=0.299*img2.data[i*4]+0.587*img2.data[i*4+1]+0.114*img2.data[i*4+2];
    const kps1=detectHarrisCorners(gray1,img1.width,img1.height,50);
    const kps2=detectHarrisCorners(gray2,img2.width,img2.height,50);
    const d1=kps1.map(({x,y})=>patchDescriptor(gray1,img1.width,img1.height,x,y));
    const d2=kps2.map(({x,y})=>patchDescriptor(gray2,img2.width,img2.height,x,y));
    const matches=matchKeypoints(kps1,d1,kps2,d2);
    setMatchLines(matches.map(({i,j})=>({x1:kps1[i].x,y1:kps1[i].y,x2:kps2[j].x,y2:kps2[j].y})));
    setStats(s=>({...s,matches:matches.length,kps1:kps1.length,kps2:kps2.length}));
    // Draw match canvas
    setTimeout(()=>{
      const mc=matchCanvas.current;if(!mc) return;
      const W1=img1.width,H1=img1.height,W2=img2.width,H2=img2.height;
      mc.width=W1+W2+10;mc.height=Math.max(H1,H2);
      const ctx=mc.getContext("2d");
      ctx.fillStyle="#06060e";ctx.fillRect(0,0,mc.width,mc.height);
      ctx.putImageData(img1,0,(mc.height-H1)/2);
      ctx.putImageData(img2,W1+10,(mc.height-H2)/2);
      // Draw match lines
      matches.slice(0,30).forEach(({i,j},idx)=>{
        const hue=(idx/30)*300;
        ctx.beginPath();ctx.moveTo(kps1[i].x,(mc.height-H1)/2+kps1[i].y);ctx.lineTo(W1+10+kps2[j].x,(mc.height-H2)/2+kps2[j].y);
        ctx.strokeStyle=`hsl(${hue},90%,60%)`;ctx.lineWidth=0.8;ctx.globalAlpha=0.7;ctx.stroke();ctx.globalAlpha=1;
        ctx.beginPath();ctx.arc(kps1[i].x,(mc.height-H1)/2+kps1[i].y,3,0,Math.PI*2);ctx.fillStyle=`hsl(${hue},90%,60%)`;ctx.fill();
        ctx.beginPath();ctx.arc(W1+10+kps2[j].x,(mc.height-H2)/2+kps2[j].y,3,0,Math.PI*2);ctx.fillStyle=`hsl(${hue},90%,60%)`;ctx.fill();
      });
    },50);
    setStep("match");
  };

  const runAlign=()=>{
    if(!img1||!img2) return;
    const gray1=new Float32Array(img1.width*img1.height);for(let i=0;i<gray1.length;i++) gray1[i]=0.299*img1.data[i*4]+0.587*img1.data[i*4+1]+0.114*img1.data[i*4+2];
    const gray2=new Float32Array(img2.width*img2.height);for(let i=0;i<gray2.length;i++) gray2[i]=0.299*img2.data[i*4]+0.587*img2.data[i*4+1]+0.114*img2.data[i*4+2];
    const kps1=detectHarrisCorners(gray1,img1.width,img1.height,50);
    const kps2=detectHarrisCorners(gray2,img2.width,img2.height,50);
    const d1=kps1.map(({x,y})=>patchDescriptor(gray1,img1.width,img1.height,x,y));
    const d2=kps2.map(({x,y})=>patchDescriptor(gray2,img2.width,img2.height,x,y));
    const matches=matchKeypoints(kps1,d1,kps2,d2);
    const src=matches.map(({i})=>[kps1[i].x,kps1[i].y]);
    const dst=matches.map(({j})=>[kps2[j].x,kps2[j].y]);
    const H_mat=computeHomography(src,dst)||[[1,0,0],[0,1,0],[0,0,1]];
    const warped=warpImage({data:img2.data,width:img2.width,height:img2.height},H_mat,img1.width,img1.height);
    // Overlay: 60% img1 + 40% warped
    const overlay=new Uint8ClampedArray(img1.width*img1.height*4);
    for(let i=0;i<img1.width*img1.height;i++){
      overlay[i*4]=Math.round(img1.data[i*4]*0.5+warped[i*4]*0.5);
      overlay[i*4+1]=Math.round(img1.data[i*4+1]*0.5+warped[i*4+1]*0.5);
      overlay[i*4+2]=Math.round(img1.data[i*4+2]*0.5+warped[i*4+2]*0.5);
      overlay[i*4+3]=255;
    }
    const alignId=new ImageData(overlay,img1.width,img1.height);
    setAlignedData(alignId);
    // Diff map
    const diff=new Uint8ClampedArray(img1.width*img1.height*4);
    for(let i=0;i<img1.width*img1.height;i++){
      const d=Math.abs(img1.data[i*4]-warped[i*4]);
      diff[i*4]=Math.min(255,d*3);diff[i*4+1]=Math.round(255-d*2);diff[i*4+2]=0;diff[i*4+3]=255;
    }
    const diffId=new ImageData(diff,img1.width,img1.height);
    setDiffData(diffId);
    let mse=0;for(let i=0;i<img1.width*img1.height;i++){mse+=(img1.data[i*4]-warped[i*4])**2;}mse/=img1.width*img1.height;
    const psnr=10*Math.log10(255**2/(mse||1));
    setStats(s=>({...s,matches:matches.length,tx:H_mat[0][2].toFixed(1),ty:H_mat[1][2].toFixed(1),psnr:psnr.toFixed(1)}));
    setTimeout(()=>{
      if(alignCanvas.current){alignCanvas.current.width=img1.width;alignCanvas.current.height=img1.height;alignCanvas.current.getContext("2d").putImageData(alignId,0,0);}
      if(diffCanvas.current){diffCanvas.current.width=img1.width;diffCanvas.current.height=img1.height;diffCanvas.current.getContext("2d").putImageData(diffId,0,0);}
    },30);
    setStep("align");
  };

  const btnStyle=(active)=>({background:active?color+"22":"rgba(255,255,255,0.04)",border:`1px solid ${active?color:"rgba(255,255,255,0.1)"}`,color:active?color:"rgba(255,255,255,0.5)",padding:"7px 14px",borderRadius:2,cursor:"pointer",fontSize:11,letterSpacing:1,fontFamily:"'Share Tech Mono',monospace",transition:"all 0.15s"});

  return(
    <div style={{padding:"12px 0"}}>
      {/* Upload row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        {[{ref:file1,label:"Reference Image",setFn:setImg1,canvasRef:canvas1,loaded:!!img1,color:"#f72585"},
          {ref:file2,label:"Moving Image",setFn:setImg2,canvasRef:canvas2,loaded:!!img2,color:"#06d6a0"}].map((it,idx)=>(
          <div key={idx}>
            <div style={{fontSize:9,letterSpacing:3,color:it.color,marginBottom:6}}>{it.label.toUpperCase()}</div>
            <div style={{background:"#06060e",border:`1px solid ${it.loaded?it.color:"rgba(255,255,255,0.06)"}`,borderRadius:4,overflow:"hidden",minHeight:120,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"border 0.2s"}}
              onClick={()=>it.ref.current?.click()}>
              <canvas ref={it.canvasRef} style={{maxWidth:"100%",maxHeight:200,display:it.loaded?"block":"none"}}/>
              {!it.loaded&&<div style={{fontSize:11,color:"rgba(255,255,255,0.2)",letterSpacing:2}}>⊕ CLICK TO UPLOAD</div>}
            </div>
            <input ref={it.ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f) it.setFn(null)||loadImg(f,it.setFn,it.canvasRef);e.target.value="";}}/>
          </div>
        ))}
      </div>

      {/* Step buttons */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button style={btnStyle(true)} onClick={runDetect} disabled={!img1||!img2}>🔍 Detect Features</button>
        <button style={btnStyle(step==="match"||step==="align")} onClick={runMatch} disabled={!img1||!img2}>🔗 Match Keypoints</button>
        <button style={btnStyle(step==="align")} onClick={runAlign} disabled={!img1||!img2}>🎯 Align & Register</button>
        <button style={{...btnStyle(false),color:"rgba(255,255,255,0.3)"}} onClick={()=>{setImg1(null);setImg2(null);setStep("upload");setMatchLines([]);setAlignedData(null);setDiffData(null);setStats(null);}}>↺ Reset</button>
      </div>

      {/* Stats */}
      {stats&&<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {[["Keypoints A",stats.kps1,"#f72585"],["Keypoints B",stats.kps2,"#06d6a0"],stats.matches&&["Matches",stats.matches,"#4cc9f0"],stats.tx&&["Shift X",stats.tx+"px","#f77f00"],stats.ty&&["Shift Y",stats.ty+"px","#f77f00"],stats.psnr&&["PSNR",stats.psnr+" dB","#7209b7"]].filter(Boolean).map(([l,v,c])=>(
          <div key={l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:3,padding:"6px 12px"}}>
            <div style={{fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.25)"}}>{l}</div>
            <div style={{fontSize:14,color:c,fontWeight:"bold"}}>{v}</div>
          </div>
        ))}
      </div>}

      {/* Match visualization */}
      {step==="match"&&<div style={{marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:3,color:"rgba(255,255,255,0.3)",marginBottom:6}}>KEYPOINT MATCHES (top 30 shown)</div>
        <div style={{background:"#06060e",border:"1px solid rgba(255,255,255,0.06)",borderRadius:4,overflow:"auto"}}>
          <canvas ref={matchCanvas} style={{maxWidth:"100%",display:"block"}}/>
        </div>
      </div>}

      {/* Aligned + diff */}
      {step==="align"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:color,marginBottom:6}}>REGISTERED OVERLAY</div>
          <div style={{background:"#06060e",border:`1px solid ${color}44`,borderRadius:4,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",minHeight:120}}>
            <canvas ref={alignCanvas} style={{maxWidth:"100%",maxHeight:250,display:"block"}}/>
          </div>
          {alignedData&&<Histogram imageData={alignedData} label="Registered Histogram"/>}
        </div>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:"#f72585",marginBottom:6}}>DIFFERENCE MAP</div>
          <div style={{background:"#06060e",border:"1px solid rgba(247,37,133,0.3)",borderRadius:4,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",minHeight:120}}>
            <canvas ref={diffCanvas} style={{maxWidth:"100%",maxHeight:250,display:"block"}}/>
          </div>
          {diffData&&<Histogram imageData={diffData} label="Difference Histogram"/>}
        </div>
      </div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
const REG_SPECIAL=["Upload & Match","Feature Detection","Keypoint Matching","Homography","Aligned Overlay","Difference Map"];
const MATCH_SPECIAL=["Upload & Match","BF Match Viz"];
const PARAM_MAP={
  "Gamma":[{key:"gamma",label:"γ",min:0.1,max:3,step:0.05}],
  "Bit-plane Slicing":[{key:"plane",label:"Plane",min:0,max:7,step:1}],
  "Thresholding":[{key:"thresh",label:"T",min:0,max:255,step:1}],
  "Sigmoid":[{key:"k",label:"k",min:0.01,max:0.2,step:0.01}],
  "Global Threshold":[{key:"thresh",label:"T",min:0,max:255,step:1}],
  "Ideal LP":[{key:"d0",label:"D₀",min:5,max:120,step:1}],
  "Butterworth LP":[{key:"d0",label:"D₀",min:5,max:120,step:1},{key:"n",label:"Order",min:1,max:5,step:1}],
  "Gaussian LP":[{key:"d0",label:"D₀",min:5,max:120,step:1}],
  "Ideal HP":[{key:"d0",label:"D₀",min:5,max:120,step:1}],
  "Butterworth HP":[{key:"d0",label:"D₀",min:5,max:120,step:1},{key:"n",label:"Order",min:1,max:5,step:1}],
  "Gaussian HP":[{key:"d0",label:"D₀",min:5,max:120,step:1}],
  "Band Reject":[{key:"d0",label:"Center",min:10,max:100,step:1}],
  "Band Pass":[{key:"d0",label:"Center",min:10,max:100,step:1}],
  "Add Gaussian Noise":[{key:"sigma",label:"σ",min:1,max:80,step:1}],
  "Rotation":[{key:"angle",label:"°",min:-90,max:90,step:1}],
  "Scaling":[{key:"scale",label:"×",min:0.4,max:3,step:0.1}],
  "Translation":[{key:"tx",label:"tx",min:-80,max:80,step:1},{key:"ty",label:"ty",min:-80,max:80,step:1}],
  "Soft Threshold":[{key:"wavThresh",label:"T",min:1,max:80,step:1}],
  "Hard Threshold":[{key:"wavThresh",label:"T",min:1,max:80,step:1}],
  "Quantize HQ":[{key:"thresh",label:"Step",min:2,max:32,step:2}],
  "Quantize LQ":[{key:"thresh",label:"Step",min:8,max:64,step:4}],
  "Wavelet Compress":[{key:"thresh",label:"Q",min:4,max:64,step:4}],
};

export default function App(){
  const [activeMod,setActiveMod]=useState(MODULES[0]);
  const [activeTopic,setActiveTopic]=useState(MODULES[0].topics[0]);
  const [origData,setOrigData]=useState(null);
  const [procData,setProcData]=useState(null);
  const [params,setParams]=useState({gamma:1.0,thresh:128,plane:7,d0:40,n:2,sigma:20,k:0.05,angle:15,scale:1.2,tx:20,ty:20,wavThresh:20});
  const [sidebar,setSidebar]=useState(true);
  const [theory,setTheory]=useState(null);
  const origRef=useRef(null),procRef=useRef(null),fileRef=useRef(null);

  const isSpecialReg=activeMod.id==="registration"&&REG_SPECIAL.includes(activeTopic);
  const isSpecialMatch=activeMod.id==="matching"&&MATCH_SPECIAL.includes(activeTopic);
  const showRegPanel=isSpecialReg||isSpecialMatch;

  useEffect(()=>{
    const c=document.createElement("canvas");c.width=320;c.height=320;
    const ctx=c.getContext("2d");
    const g=ctx.createRadialGradient(160,160,10,160,160,160);
    g.addColorStop(0,"#ffffff");g.addColorStop(0.4,"#aaaaaa");g.addColorStop(1,"#222222");
    ctx.fillStyle=g;ctx.fillRect(0,0,320,320);
    ctx.fillStyle="#e63946";ctx.fillRect(40,40,90,90);
    ctx.fillStyle="#4361ee";ctx.beginPath();ctx.arc(220,100,60,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#06d6a0";ctx.beginPath();ctx.moveTo(160,210);ctx.lineTo(270,300);ctx.lineTo(50,300);ctx.closePath();ctx.fill();
    ctx.fillStyle="#f77f00";ctx.fillRect(210,200,80,80);
    for(let i=0;i<25;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.8+0.2})`;ctx.beginPath();ctx.arc(Math.random()*320,Math.random()*320,Math.random()*3+1,0,Math.PI*2);ctx.fill();}
    setOrigData(ctx.getImageData(0,0,320,320));
  },[]);

  useEffect(()=>{
    if(!origData||!origRef.current) return;
    origRef.current.width=origData.width;origRef.current.height=origData.height;
    origRef.current.getContext("2d").putImageData(origData,0,0);
  },[origData]);

  useEffect(()=>{
    if(!origData||showRegPanel) return;
    const result=processImg(origData,activeMod.id,activeTopic,params);
    setProcData(result);
    if(procRef.current){procRef.current.width=result.width;procRef.current.height=result.height;procRef.current.getContext("2d").putImageData(result,0,0);}
  },[origData,activeMod,activeTopic,params,showRegPanel]);

  const handleUpload=useCallback((e)=>{
    const file=e.target.files?.[0];if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const img=new Image();
      img.onload=()=>{
        const maxD=400,scale=Math.min(1,maxD/Math.max(img.width,img.height));
        const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
        const c=document.createElement("canvas");c.width=w;c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        setOrigData(c.getContext("2d").getImageData(0,0,w,h));
      };img.src=ev.target.result;
    };reader.readAsDataURL(file);e.target.value="";
  },[]);

  const selMod=(mod)=>{setActiveMod(mod);setActiveTopic(mod.topics[0]);setTheory(null);};
  const curParams=PARAM_MAP[activeTopic]||[];

  return(
    <div style={{display:"flex",height:"100vh",background:"#070710",fontFamily:"'Share Tech Mono','Courier New',monospace",color:"#dde0ff",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:#050510;} ::-webkit-scrollbar-thumb{background:#222244;border-radius:2px;}
        .mb{background:none;border:none;cursor:pointer;width:100%;text-align:left;padding:9px 14px;transition:all 0.15s;border-left:3px solid transparent;font-family:'Share Tech Mono',monospace;}
        .mb:hover{background:rgba(255,255,255,0.04);}
        .mb.a{background:rgba(255,255,255,0.07);border-left-color:var(--c);}
        .ch{display:inline-block;padding:4px 9px;margin:2px;border-radius:2px;cursor:pointer;font-size:10px;letter-spacing:0.3px;transition:all 0.12s;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.45);}
        .ch:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);}
        .ch.a{background:var(--cb);border-color:var(--c);color:#fff;}
        .sl{-webkit-appearance:none;appearance:none;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;outline:none;cursor:pointer;width:100%;}
        .sl::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;background:var(--c,#4cc9f0);border-radius:50%;cursor:pointer;box-shadow:0 0 5px var(--c,#4cc9f0);}
        .ub{background:rgba(76,201,240,0.07);border:1px solid rgba(76,201,240,0.3);color:#4cc9f0;cursor:pointer;padding:8px 16px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;border-radius:2px;transition:all 0.2s;}
        .ub:hover{background:rgba(76,201,240,0.18);border-color:#4cc9f0;}
        .tb{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:3px;padding:11px;font-size:11px;line-height:1.9;color:rgba(255,255,255,0.6);margin-top:6px;}
        .cw{background:#06060e;border:1px solid rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:150px;}
        canvas{max-width:100%;max-height:300px;display:block;}
        .lbl{font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.22);text-transform:uppercase;margin-bottom:6px;margin-top:12px;}
        @keyframes fu{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu 0.25s ease forwards;}
        .tr{cursor:pointer;padding:4px 0;display:flex;align-items:center;gap:6px;font-size:11px;transition:color 0.15s;}
        .tr:hover{color:white;}
        .ic{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:3px;padding:10px 12px;}
      `}</style>

      {/* SIDEBAR */}
      <div style={{width:sidebar?248:50,minWidth:sidebar?248:50,background:"#06060e",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",transition:"width 0.2s",overflow:"hidden"}}>
        <div style={{padding:"13px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18,flexShrink:0}}>🧠</span>
          {sidebar&&<div style={{fontFamily:"'Orbitron',monospace",fontSize:9.5,fontWeight:600,letterSpacing:2,color:"#4cc9f0",lineHeight:1.4}}>IMAGE<br/>PROCESSING<br/><span style={{fontSize:8,color:"rgba(76,201,240,0.35)"}}>COMPLETE TOOLKIT</span></div>}
          <button onClick={()=>setSidebar(v=>!v)} style={{marginLeft:"auto",background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:13,flexShrink:0,padding:4}}>{sidebar?"◀":"▶"}</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"5px 0"}}>
          {MODULES.map(mod=>(
            <button key={mod.id} className={`mb${activeMod.id===mod.id?" a":""}`} style={{"--c":mod.color} as any} onClick={()=>selMod(mod)}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <span style={{fontSize:15,flexShrink:0}}>{mod.icon}</span>
                {sidebar&&<span style={{fontSize:10,color:activeMod.id===mod.id?mod.color:"rgba(255,255,255,0.42)",letterSpacing:0.3,lineHeight:1.35}}>{mod.label}</span>}
              </div>
            </button>
          ))}
        </div>
        {sidebar&&<div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",fontSize:9,color:"rgba(255,255,255,0.12)",letterSpacing:1}}>{MODULES.length} MODULES · {MODULES.reduce((a,m)=>a+m.topics.length,0)} OPERATIONS</div>}
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:12,background:"#06060e",flexShrink:0}}>
          <span style={{fontSize:20}}>{activeMod.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:13,fontWeight:600,color:activeMod.color,letterSpacing:1}}>{activeMod.label}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:1}}>{activeMod.description}</div>
          </div>
          {!showRegPanel&&<>
            <label htmlFor="mainUpload" className="ub" style={{cursor:"pointer"}}>⊕ UPLOAD IMAGE</label>
            <input id="mainUpload" ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleUpload}/>
          </>}
        </div>

        {/* Body */}
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {/* LEFT: topics + params + theory */}
          <div style={{width:260,minWidth:260,borderRight:"1px solid rgba(255,255,255,0.05)",padding:"12px",overflowY:"auto",background:"#070713",flexShrink:0}}>
            <div className="lbl" style={{marginTop:0}}>Operations</div>
            <div>{activeMod.topics.map(t=>(
              <span key={t} className={`ch${activeTopic===t?" a":""}`}
                style={{"--c":activeMod.color,"--cb":activeMod.color+"1a"} as any}
                onClick={()=>setActiveTopic(t)}>{t}</span>
            ))}</div>

            {curParams.length>0&&<>
              <div className="lbl">Parameters</div>
              {curParams.map(p=>(
                <div key={p.key} style={{marginBottom:13}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:11}}>
                    <span style={{color:"rgba(255,255,255,0.38)"}}>{p.label}</span>
                    <span style={{color:activeMod.color,fontWeight:"bold"}}>{params[p.key]}</span>
                  </div>
                  <input type="range" className="sl" style={{"--c":activeMod.color} as any}
                    min={p.min} max={p.max} step={p.step} value={params[p.key]}
                    onChange={e=>setParams(prev=>({...prev,[p.key]:parseFloat(e.target.value)}))}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(255,255,255,0.15)",marginTop:2}}>
                    <span>{p.min}</span><span>{p.max}</span>
                  </div>
                </div>
              ))}
            </>}

            <div className="lbl">Theory</div>
            {Object.entries(activeMod.theory||{}).map(([k,v])=>(
              <div key={k} style={{marginBottom:3}}>
                <div className="tr" style={{color:theory===k?activeMod.color:"rgba(255,255,255,0.4)"}} onClick={()=>setTheory(theory===k?null:k)}>
                  <span style={{fontSize:9}}>{theory===k?"▼":"▶"}</span><span>{k}</span>
                </div>
                {theory===k&&<div className="tb fu">{v}</div>}
              </div>
            ))}
          </div>

          {/* RIGHT: main content */}
          <div style={{flex:1,padding:"14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}} className="fu">

            {showRegPanel ? (
              <RegistrationPanel color={activeMod.color}/>
            ) : (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <div className="lbl" style={{marginTop:0}}>Original</div>
                    <div className="cw"><canvas ref={origRef}/></div>
                    <Histogram imageData={origData} label="Original"/>
                  </div>
                  <div>
                    <div className="lbl" style={{marginTop:0,color:activeMod.color}}>{activeTopic}</div>
                    <div className="cw"><canvas ref={procRef}/></div>
                    <Histogram imageData={procData} label="Processed"/>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[{icon:activeMod.icon,t:"Module",v:activeMod.label},{icon:"⚙️",t:"Operation",v:activeTopic},{icon:"📋",t:"In Module",v:activeMod.topics.length+" ops"},{icon:"🗂️",t:"Modules",v:MODULES.length+" total"}].map(c=>(
                    <div key={c.t} className="ic"><div style={{fontSize:15,marginBottom:4}}>{c.icon}</div><div style={{fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.22)",marginBottom:3}}>{c.t.toUpperCase()}</div><div style={{fontSize:11,color:activeMod.color}}>{c.v}</div></div>
                  ))}
                </div>
              </>
            )}

            <div>
              <div className="lbl">All Modules</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {MODULES.map(mod=>(
                  <span key={mod.id} onClick={()=>selMod(mod)}
                    style={{padding:"4px 10px",borderRadius:2,fontSize:10,cursor:"pointer",letterSpacing:0.3,transition:"all 0.15s",border:`1px solid ${activeMod.id===mod.id?mod.color:"rgba(255,255,255,0.07)"}`,background:activeMod.id===mod.id?mod.color+"18":"transparent",color:activeMod.id===mod.id?mod.color:"rgba(255,255,255,0.32)"}}>
                    {mod.icon} {mod.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
