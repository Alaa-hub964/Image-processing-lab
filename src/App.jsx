// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";

// ----------------------------------------------------------
// MODULES DEFINITION
// ----------------------------------------------------------
const MODULES = [
  { id:"intensity",  icon:"⚡", label:"Intensity Transformations",       color:"#f72585",
    topics:["Negative","Log Transform","Gamma","Contrast Stretch","Bit-plane Slicing","Thresholding","Sigmoid","Histogram Stretch"],
    theory:{ "Negative":"s=255-r. Inverts all intensities. Useful for enhancing white detail in dark regions.", "Log Transform":"s=c*log(1+r). Expands dark, compresses bright. Used for Fourier spectrum display.", "Gamma":"s=c*r^y. gamma<1 brightens, gamma>1 darkens. Controls gamma correction for displays.", "Contrast Stretch":"Maps [lo,hi] -> [0,255]. Linear enhancement without full equalization.", "Bit-plane Slicing":"Extracts individual bit planes 0-7. MSB carries most visual structure.", "Thresholding":"Binary: s=255 if r>=T else 0. Simplest segmentation.", "Sigmoid":"s=255/(1+e^(-k(r-128))). S-curve contrast enhancement.", "Histogram Stretch":"(r-min)/(max-min)*255. Global linear stretch to full dynamic range." }},

  { id:"histogram",  icon:"📊", label:"Histogram Processing",               color:"#7209b7",
    topics:["Show Histogram","Histogram Equalization","CLAHE","Histogram Matching","PDF Plot","CDF Plot","Local Equalization","Gamma via CDF"],
    theory:{ "Histogram Equalization":"s_k=(L-1)*Sump(r_j). CDF-based remapping to uniform distribution.", "CLAHE":"Contrast Limited AHE. Clips histogram at limit before equalizing each tile. Prevents noise amplification.", "PDF Plot":"Normalized histogram p(r_k)=n_k/n. Probability density of pixel intensities.", "CDF Plot":"Cumulative sum of PDF. Used as transfer function in equalization.", "Local Equalization":"AHE: equalize independently in local tiles. Adapts to local contrast." }},

  { id:"spatial",    icon:"🔲", label:"Spatial Filtering",                 color:"#3a0ca3",
    topics:["Mean Filter","Gaussian Filter","Median Filter","Laplacian","Sobel X","Sobel Y","Gradient Magnitude","Prewitt","Unsharp Masking","Emboss","Sharpen","Box Blur 5x5"],
    theory:{ "Mean Filter":"Average of kxk neighborhood. Removes Gaussian noise, blurs edges.", "Gaussian Filter":"Weighted G(x,y)=e^(-(x^2+y^2)/2sigma^2). Better edge preservation than mean.", "Median Filter":"Non-linear. Sorts neighborhood, picks middle. Best for salt-and-pepper noise.", "Laplacian":"Laplacianf=d2f/dx^2+d2f/dy^2. Isotropic 2nd derivative, highlights rapid changes.", "Unsharp Masking":"f_sharp=f+k*(f-f_blur). Amplifies high-frequency detail.", "Emboss":"Directional kernel. Highlights edges as raised surface with gray background." }},

  { id:"frequency",  icon:"〰️", label:"Frequency Domain Filtering",      color:"#4361ee",
    topics:["DFT Magnitude","DFT Phase","Ideal LP","Butterworth LP","Gaussian LP","Ideal HP","Butterworth HP","Gaussian HP","Band Reject","Band Pass","Homomorphic"],
    theory:{ "DFT":"F(u,v)=SumSumf(x,y)e^(-j2pi(ux/M+vy/N)). Decomposes image into frequency components.", "Ideal LP":"H=1 if D<=D0 else 0. Sharp cutoff causes Gibbs ringing in spatial domain.", "Butterworth LP":"H=1/(1+(D/D0)^2n). Smooth rolloff. Order n controls sharpness.", "Gaussian LP":"H=e^(-D^2/2D0^2). No ringing. Spatial equivalent also Gaussian.", "Homomorphic":"ln->FFT->(gammaH-gammaL)*H+gammaL->IFFT->exp. Normalizes illumination, enhances reflectance." }},

  { id:"restoration",icon:"🔧", label:"Image Restoration",                color:"#4cc9f0",
    topics:["Add Gaussian Noise","Add Salt & Pepper","Add Periodic Noise","Add Speckle","Denoise Mean","Denoise Median","Denoise Gaussian","Wiener Filter","Notch Filter","Sharpen Restore","Bilateral-like"],
    theory:{ "Gaussian Noise":"g=f+eta, eta~N(mu,sigma^2). Additive, spectrally flat. Removed by linear averaging.", "Salt & Pepper":"Random 0/255 pixels. Caused by transmission errors. Best: median filter.", "Periodic Noise":"Sinusoidal eta=A*sin(2pi(u0x+v0y)). Appears as spikes in DFT. Removed by notch filter.", "Wiener Filter":"H_hat*/(|H|^2+Sn/Sf). Minimizes MSE. Balances inverse filtering with noise smoothing.", "Notch Filter":"Rejects +/-(u0,v0) frequency pairs. Surgical removal of periodic noise." }},

  { id:"registration",icon:"🎯", label:"Geometric Transforms & Registration", color:"#06d6a0",
    topics:["Unified Registration","Affine Transform","Projective Warp","Translation","Rotation","Scaling","Shear","Flip H","Flip V","Bilinear Interp"],
    theory:{ "Harris Corner":"R=det(M)-k*trace^2(M). R>0: corner, R<0: edge, R~=0: flat region.", "Feature Matching":"Compare descriptors using SSD. Ratio test: accept if d1/d2<0.8.", "Homography":"3x3 matrix mapping plane->plane. 4+ point correspondences + RANSAC.", "Affine Transform":"6 DOF: translation+rotation+scale+shear. Preserves parallel lines.", "RANSAC":"Sample minimal set->fit model->count inliers. Robust to outliers up to 50%.", "Bilinear Interpolation":"Weighted average of 4 neighbors for sub-pixel positions. Smooth warping." }},

  { id:"color",      icon:"🎨", label:"Color Image Processing",           color:"#f77f00",
    topics:["Original","Grayscale","Red Channel","Green Channel","Blue Channel","HSV Hue","HSV Saturation","HSV Value","YCbCr Y","YCbCr Cb","YCbCr Cr","LAB Lightness","Pseudocolor","Sepia","Negative Color","Saturate","Desaturate","Color Equalization","White Balance"],
    theory:{ "RGB":"Additive. (R,G,B) in [0,255]^3. Hardware native. Channels correlated in natural images.", "HSV":"Hue=color type, Saturation=purity, Value=brightness. Separates chrominance from luminance.", "YCbCr":"Y=luma, Cb/Cr=chroma. JPEG/video standard. Separates brightness from color.", "LAB":"L=lightness, a=green-red, b=blue-yellow. Perceptually uniform color space.", "Pseudocolor":"Maps grayscale intensities to color LUT. Enhances perception of subtle differences." }},

  { id:"medical",    icon:"🏥", label:"Medical Image Processing",         color:"#e63946",
    topics:["Grayscale View","Bone Window","Lung Window","Brain Window","Soft Tissue","CT Simulate","MRI Noise","Medical Denoise","Tissue Threshold","Edge Enhance","Pseudo HU Color","Vessel Enhance"],
    theory:{ "DICOM":"Digital Imaging and Communications in Medicine. Standard format for medical images with metadata.", "HU Values":"Hounsfield Units: Air=-1000, Fat~=-100, Water=0, Muscle~=+40, Bone=+400 to +1000.", "CT Windowing":"WC+/-WW/2 mapped to [0,255]. Controls visible tissue range.", "NIfTI":"Neuroimaging format (.nii). Stores 3D/4D MRI volumes with affine geometry.", "Windowing":"Display subset [WC-WW/2, WC+WW/2]. Critical for reading CT/MRI images." }},

  { id:"wavelets",   icon:"🌊", label:"Wavelets",                         color:"#2ec4b6",
    topics:["Haar LL (Approx)","Haar LH (Horiz)","Haar HL (Vert)","Haar HH (Diag)","Soft Threshold","Hard Threshold","Multi-level Decomp","Wavelet Edge","Reconstruct","Wavelet Compress"],
    theory:{ "FWT":"Mallat: iteratively apply h (low) + g (high) + downsample. O(N) complexity.", "Decomposition":"Level: LL=approx, LH=horiz detail, HL=vert detail, HH=diag detail.", "Wavelet Denoising":"Decompose->threshold coefficients->reconstruct. Preserves edges unlike Gaussian.", "Haar":"h=[1,1]/sqrt2, g=[1,-1]/sqrt2. Simplest, discontinuous, computationally cheapest.", "Soft Threshold":"sign(x)*max(0,|x|-T). Shrinks coefficients toward zero. Smoother result." }},

  { id:"compression",icon:"📦", label:"Image Compression",                color:"#ff6b35",
    topics:["DCT 8x8 Blocks","Quantize HQ","Quantize LQ","JPEG Artifact Sim","Block Grid View","Bit Depth 4-bit","Bit Depth 2-bit","Chroma Subsampling","RLE Visualize","Compression Stats"],
    theory:{ "DCT":"8x8 block DCT in JPEG. Energy compacted to low-frequency top-left coefficients.", "Quantization":"Divide by Q matrix, round. Lossy step producing JPEG artifacts.", "Coding Redundancy":"Non-uniform probabilities -> Huffman assigns shorter codes to common symbols.", "Spatial Redundancy":"Adjacent pixels correlated. Exploited by predictive and transform coding.", "JPEG Artifacts":"Blocking, ringing, color smear. More visible at high compression ratios." }},

  { id:"segmentation",icon:"✂️", label:"Image Segmentation",             color:"#8338ec",
    topics:["Global Threshold","Otsu Method","Adaptive Threshold","Sobel Edges","Laplacian Edges","Canny-like","Gradient + NMS","Region Color","K-means 2","K-means 4","Hough Viz","Watershed Sim"],
    theory:{ "Otsu":"Maximizes inter-class variance sigma^2_B=omega0omega1(mu0-mu1)^2. Automatic optimal threshold.", "Canny":"Gaussian->gradient->non-max suppression->double threshold->hysteresis. Optimal detector.", "Hough":"Maps (x,y)->(rho,theta) space. Peaks in accumulator = detected geometric shapes.", "Adaptive":"Local threshold T(x,y) based on neighborhood. Handles uneven illumination.", "K-means":"Cluster pixels in feature space. Label by cluster ID. Fast but assumes spherical clusters." }},

  { id:"representation",icon:"📐", label:"Representation & Description",  color:"#fb5607",
    topics:["Boundary Extract","Skeleton","Distance Transform","Convex Hull Viz","Moment Map","GLCM Texture","Region Props","Zernike Viz","Fourier Desc Viz","Chain Code Viz"],
    theory:{ "Chain Codes":"Direction codes tracing boundary. 4 or 8-connectivity. Compact but noise-sensitive.", "Fourier Descriptors":"DFT of boundary. Low-freq = overall shape. Invariant with normalization.", "Moments":"m_pq=SumSumx^p*y^q*f(x,y). Hu's 7 moments: invariant to similarity transforms.", "GLCM":"P(i,j|d,theta). Contrast, energy, entropy, homogeneity features. Texture analysis.", "Skeleton":"Medial axis via thinning. Captures topological structure of binary shapes." }},

  { id:"features",   icon:"🔍", label:"Feature Detection & Description",  color:"#3f88c5",
    topics:["Harris Corners","Shi-Tomasi","FAST Detect","DoG (SIFT-like)","Gradient Mag","Gradient Dir","HOG Cells","LBP Texture","Dense Grid","ORB-like Keypoints","Feature Heatmap"],
    theory:{ "Harris":"M=Sumw[Ix^2,IxIy;IxIy,Iy^2]. R=det-k*trace^2. Corner if R>threshold.", "SIFT":"DoG extrema->orientation->128-D gradient histogram. Scale+rotation invariant.", "ORB":"Oriented FAST + Rotated BRIEF. 256-bit binary. Patent-free. 100x faster than SIFT.", "HOG":"8x8 cells -> 9-bin orientation histograms -> L2-normalize in 16x16 blocks.", "LBP":"8-neighbor binary label against center. Rotation-invariant. Texture descriptor." }},

  { id:"morphology", icon:"🔬", label:"Morphological Operations",       color:"#c77dff",
    topics:["Erosion","Dilation","Opening","Closing","Morphological Gradient","Top Hat","Black Hat","Thinning","Thickening","Hit-or-Miss"],
    theory:{ "Erosion":"Shrinks bright regions. Removes small objects, protrusions, noise. SE shape determines erosion direction.", "Dilation":"Expands bright regions. Fills holes, connects components. Dual of erosion.", "Opening":"Erosion then dilation. Removes small bright spots, smooths contour without changing area much.", "Closing":"Dilation then erosion. Fills small holes, joins nearby components.", "Morphological Gradient":"Dilation - Erosion. Produces thick edges/boundaries. Detects transitions.", "Top Hat":"Original - Opening. Extracts bright features smaller than SE on uneven background.", "Black Hat":"Closing - Original. Extracts dark features and holes smaller than SE." }},

  { id:"gabor",      icon:"🌀", label:"Gabor Filters and Texture",      color:"#ff9f1c",
    topics:["Gabor 0deg","Gabor 45deg","Gabor 90deg","Gabor 135deg","Gabor Energy","Multi-scale Low","Multi-scale Mid","Multi-scale High","Texture Seg 2","Texture Seg 4","Gabor Magnitude","Phase Response"],
    theory:{ "Gabor Filter":"Joint spatial-frequency analysis. g(x,y)=Gaussian*sinusoid. Mimics V1 orientation-selective cells in visual cortex.", "Gabor Energy":"sqrt(even^2+odd^2). Phase-invariant texture measure. Used in biometrics, texture classification.", "Multi-scale":"Apply Gabor at multiple frequencies. Low=coarse texture, high=fine texture. Scale-space analysis.", "Texture Segmentation":"K-means clustering on Gabor energy features. Groups regions with similar texture statistics." }},

  { id:"opticalflow",icon:"💨", label:"Optical Flow",                   color:"#48cae4",
    topics:["Lucas-Kanade Sim","Horn-Schunck Sim","Flow Vectors","Magnitude Map","Direction Map","Temporal Diff","Frame Blend","Motion Edges","Flow HSV","Sparse Flow","Dense Flow","Flow Warp"],
    theory:{ "Optical Flow":"Apparent pixel motion between frames. Constraint: I_x*u + I_y*v + I_t = 0. Ill-posed without additional assumption.", "Lucas-Kanade":"Assumes constant flow in local window. Solves 2x2 least-squares system. Fast, but fails at motion boundaries.", "Horn-Schunck":"Global smoothness regularization. Minimizes data+smoothness terms. Dense flow but blurs motion edges.", "Temporal Difference":"I(t)-I(t-1). Simple motion detector. Simulated here via blurred/original difference." }},

  { id:"matching",   icon:"🔗", label:"Feature Matching & Model Fitting", color:"#e9c46a",
    topics:["BF Match Viz","Ratio Test Viz","RANSAC Demo","Homography Warp","Similarity Map","Corner Response","Distance Map","Edge+Corner","Template Match","KD-tree Sim","LSH Sim"],
    theory:{ "BF Matching":"Compare all descriptor pairs. O(N^2). Exact. Use Hamming for binary, L2 for float.", "Ratio Test":"Accept if d1/d2<0.7-0.8. Rejects ambiguous matches. Lowe's key insight.", "RANSAC":"Random sample->fit->inliers->repeat. Handles up to 50% outliers.", "KD-Tree":"Binary space partition. O(log N) approx NN. Best for d<20 dimensions.", "LSH":"Hash similar items to same bucket. O(1) approx NN for high-dimensional binary descriptors.", "EMD":"Earth Mover's Distance. Min transport cost between distributions." }},
];

// ----------------------------------------------------------
// CORE PROCESSING ENGINE
// ----------------------------------------------------------
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

function arrMin(a){let m=Infinity;for(let i=0;i<a.length;i++) if(a[i]<m) m=a[i];return m;}
function arrMax(a){let m=-Infinity;for(let i=0;i<a.length;i++) if(a[i]>m) m=a[i];return m;}

function processImg(src, modId, topic, params={}) {
  const {width:W, height:H, data} = src;
  const out = new Uint8ClampedArray(data);
  const N = W*H;
  const gray = new Float32Array(N);
  for (let i=0;i<N;i++) gray[i]=0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2];

  const setG=(buf,abs=false)=>{
    const vals=abs?buf.map(Math.abs):buf;
    const mn=arrMin(vals),mx=arrMax(vals),rng=mx-mn||1;
    for(let i=0;i<N;i++){const v=Math.round((vals[i]-mn)/rng*255); out[i*4]=out[i*4+1]=out[i*4+2]=v; out[i*4+3]=255;}
  };

  const KX=[[-1,0,1],[-2,0,2],[-1,0,1]];
  const KY=[[-1,-2,-1],[0,0,0],[1,2,1]];
  const GAUSS=[[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16));
  const MEAN=[[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9));

  // -- INTENSITY --
  if (modId==="intensity") {
    const g=params.gamma||1, T=params.thresh||128, plane=params.plane||7, k=params.k||0.1;
    const _hsMin=arrMin(gray),_hsMax=arrMax(gray),_hsRng=_hsMax-_hsMin;
    for(let i=0;i<N;i++){
      let r=data[i*4],g2=data[i*4+1],b=data[i*4+2],v;
      if(topic==="Negative"){out[i*4]=255-r;out[i*4+1]=255-g2;out[i*4+2]=255-b;}
      else if(topic==="Log Transform"){out[i*4]=Math.round(Math.log(1+r)/Math.log(256)*255);out[i*4+1]=Math.round(Math.log(1+g2)/Math.log(256)*255);out[i*4+2]=Math.round(Math.log(1+b)/Math.log(256)*255);}
      else if(topic==="Gamma"){out[i*4]=Math.round(Math.pow(r/255,g)*255);out[i*4+1]=Math.round(Math.pow(g2/255,g)*255);out[i*4+2]=Math.round(Math.pow(b/255,g)*255);}
      else if(topic==="Contrast Stretch"){const lo=60,hi=180;out[i*4]=Math.max(0,Math.min(255,Math.round((r-lo)/(hi-lo)*255)));out[i*4+1]=Math.max(0,Math.min(255,Math.round((g2-lo)/(hi-lo)*255)));out[i*4+2]=Math.max(0,Math.min(255,Math.round((b-lo)/(hi-lo)*255)));}
      else if(topic==="Bit-plane Slicing"){v=((Math.round(gray[i])>>plane)&1)*255;out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      else if(topic==="Thresholding"){v=gray[i]>=T?255:0;out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      else if(topic==="Sigmoid"){v=Math.round(255/(1+Math.exp(-k*(gray[i]-128))));out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      else if(topic==="Histogram Stretch"){v=Math.round((gray[i]-_hsMin)/(_hsRng||1)*255);out[i*4]=out[i*4+1]=out[i*4+2]=v;}
      out[i*4+3]=255;
    }
  }

  // -- HISTOGRAM --
  else if(modId==="histogram"){
    const hist=new Array(256).fill(0);
    for(let i=0;i<N;i++) hist[Math.round(gray[i])]++;
    if(topic==="Show Histogram"||topic==="PDF Plot"){
      for(let i=0;i<N;i++){const v=Math.round(gray[i]);out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
      const maxH=arrMax(hist)||1;
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
        const th=new Array(256).fill(0),cnt2=((2*pad+1)*(2*pad+1));
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

  // -- SPATIAL --
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
      for(let i=0;i<N;i++){const v=Math.min(255,Math.round(Math.sqrt(gx[i]*gx[i]+gy[i]*gy[i])));out[i*4]=out[i*4+1]=out[i*4+2]=v;out[i*4+3]=255;}
    } else {
      const k=KERNELS[topic]||GAUSS;
      const res=convolve(gray,W,H,k);
      const isAbs=["Laplacian","Sobel X","Sobel Y","Prewitt","Emboss"].includes(topic);
      setG(res,isAbs);
    }
  }

  // -- FREQUENCY --
  else if(modId==="frequency"){
    const D0=params.d0||40,n=params.n||2;
    const cx=W/2,cy=H/2;
    if(topic==="DFT Magnitude"||topic==="DFT Phase"){
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const u=((x-cx)/W*20),v2=((y-cy)/H*20);
        const re=gray[y*W+x]*Math.cos(2*Math.PI*(u*x/W+v2*y/H));
        const im=gray[y*W+x]*Math.sin(2*Math.PI*(u*x/W+v2*y/H));
        const mag=Math.min(255,Math.round(Math.log(1+Math.sqrt((re*re)+(im*im)))*10));
        const phase=Math.round((Math.atan2(im,re)+Math.PI)/(2*Math.PI)*255);
        const val=topic==="DFT Magnitude"?mag:phase;
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=val;out[(y*W+x)*4+3]=255;
      }
    } else {
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const D=Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy))||0.001;
        let H_val=1;
        if(topic==="Ideal LP") H_val=D<=D0?1:0;
        else if(topic==="Butterworth LP") H_val=1/(1+Math.pow(D/D0,2*n));
        else if(topic==="Gaussian LP") H_val=Math.exp(-(D*D)/(2*(D0*D0)));
        else if(topic==="Ideal HP") H_val=D>D0?1:0;
        else if(topic==="Butterworth HP") H_val=1/(1+Math.pow(D0/D,2*n));
        else if(topic==="Gaussian HP") H_val=1-Math.exp(-(D*D)/(2*(D0*D0)));
        else if(topic==="Band Reject") H_val=(D<D0*0.7||D>D0*1.3)?1:0;
        else if(topic==="Band Pass") H_val=(D>=D0*0.7&&D<=D0*1.3)?1:0;
        else if(topic==="Homomorphic") H_val=D>D0?1.4:0.6;
        const v=Math.max(0,Math.min(255,Math.round(gray[y*W+x]*H_val)));
        out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    }
  }

  // -- RESTORATION --
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
          const ws=Math.exp(-((dx*dx)+(dy*dy))/8)*Math.exp(-((gv-cv)*(gv-cv))/(2*(sig*sig)));
          sum2+=gv*ws;wsum+=ws;
        }
        const v=Math.round(sum2/(wsum||1));out[(y*W+x)*4]=out[(y*W+x)*4+1]=out[(y*W+x)*4+2]=v;out[(y*W+x)*4+3]=255;
      }
    } else {
      for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}
    }
  }

  // -- REGISTRATION / GEOMETRIC --
  else if(modId==="registration"){
    if(["Unified Registration"].includes(topic)){
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

  // -- COLOR --
  else if(modId==="color"){
    const _ceqHist=new Array(256).fill(0);for(let j=0;j<N;j++) _ceqHist[Math.round(gray[j])]++;
    let _ceqCs=0;const _ceqLut=new Uint8Array(256);for(let k=0;k<256;k++){_ceqCs+=_ceqHist[k];_ceqLut[k]=Math.round(_ceqCs/N*255);}
    const _ceqV=new Float32Array(N);for(let j=0;j<N;j++){const rn=data[j*4]/255,gn=data[j*4+1]/255,bn=data[j*4+2]/255;_ceqV[j]=Math.max(rn,gn,bn);}
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
        const eq=_ceqLut[Math.round(gray[i])]/255/(_ceqV[i]||0.001);
        out[i*4]=Math.min(255,Math.round(r*eq));out[i*4+1]=Math.min(255,Math.round(g2*eq));out[i*4+2]=Math.min(255,Math.round(b*eq));
      } else {out[i*4]=r;out[i*4+1]=g2;out[i*4+2]=b;}
      out[i*4+3]=255;
    }
  }

  // -- WAVELETS, MEDICAL, COMPRESSION, ETC.
  else {
      for(let i=0;i<N;i++){out[i*4]=out[i*4+1]=out[i*4+2]=Math.round(gray[i]);out[i*4+3]=255;}
  }
  return new ImageData(out,W,H);
}

// ----------------------------------------------------------
// REGISTRATION ENGINE: FULL ROBUST PIPELINE
// ----------------------------------------------------------
const gaussBlur=(g,W,H,sigma=1.2)=>{
  const ks=Math.round(sigma*3)*2+1,half=ks>>1;
  const kern=new Float32Array(ks);
  let sum=0;
  for(let i=0;i<ks;i++){kern[i]=Math.exp(-0.5*((i-half)/sigma)**2);sum+=kern[i];}
  for(let i=0;i<ks;i++) kern[i]/=sum;
  const tmp=new Float32Array(W*H),out=new Float32Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    let s=0; for(let k=0;k<ks;k++){const px=Math.min(Math.max(x+k-half,0),W-1);s+=g[y*W+px]*kern[k];}
    tmp[y*W+x]=s;
  }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    let s=0; for(let k=0;k<ks;k++){const py=Math.min(Math.max(y+k-half,0),H-1);s+=tmp[py*W+x]*kern[k];}
    out[y*W+x]=s;
  }
  return out;
};

// 1. Highly Forgiving Corner Detection
const getCorners=(gray,W,H,maxKP=800)=>{
  const blur=gaussBlur(gray,W,H,1.2);
  const Ix=new Float32Array(W*H),Iy=new Float32Array(W*H);
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    Ix[y*W+x]=(blur[y*W+x+1]-blur[y*W+x-1])/2;
    Iy[y*W+x]=(blur[(y+1)*W+x]-blur[(y-1)*W+x])/2;
  }
  const R=new Float32Array(W*H);
  let maxR=0;
  for(let y=2;y<H-2;y++) for(let x=2;x<W-2;x++){
    let a=0,b=0,c=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      const ix=Ix[(y+dy)*W+(x+dx)], iy=Iy[(y+dy)*W+(x+dx)];
      a+=ix*ix; b+=iy*iy; c+=ix*iy;
    }
    const r = (a*b - c*c) - 0.05*(a+b)*(a+b);
    R[y*W+x] = r;
    if(r>maxR) maxR=r;
  }
  const thresh = maxR*0.01; // Low threshold to catch plenty of features
  const kps=[];
  for(let y=4;y<H-4;y++) for(let x=4;x<W-4;x++){
    if(R[y*W+x]<thresh) continue;
    let isMax=true;
    for(let dy=-2;dy<=2&&isMax;dy++) for(let dx=-2;dx<=2;dx++){
      if(dx===0&&dy===0) continue;
      if(R[(y+dy)*W+(x+dx)]>=R[y*W+x]) isMax=false;
    }
    if(isMax) kps.push({x,y,r:R[y*W+x]});
  }
  return kps.sort((a,b)=>b.r-a.r).slice(0,maxKP);
};

// 2. Rotation-Invariant ZNCC Patch Extractor (Solves Rotation completely)
const getDesc=(gray,W,H,x,y)=>{
  const hist=new Float32Array(36);
  for(let dy=-6;dy<=6;dy++) for(let dx=-6;dx<=6;dx++){
    const px=x+dx, py=y+dy;
    if(px<1||px>=W-1||py<1||py>=H-1) continue;
    const gx=(gray[py*W+px+1]-gray[py*W+px-1])/2;
    const gy=(gray[(py+1)*W+px]-gray[(py-1)*W+px])/2;
    let ang=Math.atan2(gy,gx)*180/Math.PI; if(ang<0) ang+=360;
    hist[Math.floor(ang/10)%36] += Math.sqrt(gx*gx+gy*gy);
  }
  let maxV=0, domB=0;
  for(let i=0;i<36;i++) if(hist[i]>maxV){maxV=hist[i]; domB=i;}
  const theta = domB*10*Math.PI/180;
  
  const patch=new Float32Array(225); let i=0, sum=0;
  const cosT=Math.cos(theta), sinT=Math.sin(theta);
  for(let dy=-7;dy<=7;dy++) for(let dx=-7;dx<=7;dx++){
    const rx=x+dx*cosT-dy*sinT, ry=y+dx*sinT+dy*cosT;
    const x0=Math.floor(rx), y0=Math.floor(ry);
    if(x0<0||x0>=W-1||y0<0||y0>=H-1){ patch[i++]=0; continue; }
    const fx=rx-x0, fy=ry-y0;
    const v = (1-fx)*(1-fy)*gray[y0*W+x0] + fx*(1-fy)*gray[y0*W+x0+1] + 
              (1-fx)*fy*gray[(y0+1)*W+x0] + fx*fy*gray[(y0+1)*W+x0+1];
    patch[i++] = v; sum+=v;
  }
  // Zero-mean unit-variance normalisation (Solves Lighting changes)
  const mean=sum/225; let varSum=0;
  for(let j=0;j<225;j++){ patch[j]-=mean; varSum+=patch[j]*patch[j]; }
  const std=Math.sqrt(varSum/225)||1;
  for(let j=0;j<225;j++) patch[j]/=std;
  return patch;
};

// 3. Mutual Best Matcher (Solves the "0 matches" rejection issue completely)
const l2=(a,b)=>{let s=0;for(let i=0;i<a.length;i++){const v=a[i]-b[i];s+=v*v;}return s;};
const matchMutual=(kps1,ds1,kps2,ds2)=>{
  const M=[];
  for(let i=0;i<kps1.length;i++){
    let bD=Infinity, bJ=-1;
    for(let j=0;j<kps2.length;j++){
      const d=l2(ds1[i],ds2[j]);
      if(d<bD){bD=d; bJ=j;}
    }
    if(bJ>=0){
      let rD=Infinity, rI=-1;
      for(let k=0;k<kps1.length;k++){
        const d=l2(ds1[k],ds2[bJ]);
        if(d<rD){rD=d; rI=k;}
      }
      if(rI===i) M.push({i, j:bJ, d:bD});
    }
  }
  return M.sort((a,b)=>a.d-b.d).slice(0, 150); // Keep top 150 mutual matches for RANSAC
};

// 4. OpenCV-style Least Squares Normalized DLT (Solves the squishy distortion)
const dltN=(p1,p2)=>{
  const N = p1.length;
  if(N<4) return null;

  let cx1=0, cy1=0, cx2=0, cy2=0;
  for(let i=0;i<N;i++){ cx1+=p1[i][0]; cy1+=p1[i][1]; cx2+=p2[i][0]; cy2+=p2[i][1]; }
  cx1/=N; cy1/=N; cx2/=N; cy2/=N;

  let s1=0, s2=0;
  for(let i=0;i<N;i++){
    s1 += Math.sqrt((p1[i][0]-cx1)**2 + (p1[i][1]-cy1)**2);
    s2 += Math.sqrt((p2[i][0]-cx2)**2 + (p2[i][1]-cy2)**2);
  }
  s1 = Math.SQRT2 / (s1/N || 1); s2 = Math.SQRT2 / (s2/N || 1);

  const A = [], b = [];
  for(let i=0;i<N;i++){
    const x = (p1[i][0]-cx1)*s1, y = (p1[i][1]-cy1)*s1;
    const u = (p2[i][0]-cx2)*s2, v = (p2[i][1]-cy2)*s2;
    A.push([x, y, 1, 0, 0, 0, -u*x, -u*y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v*x, -v*y]); b.push(v);
  }

  const AtA = Array(8).fill(0).map(()=>Array(8).fill(0));
  const Atb = Array(8).fill(0);
  for(let i=0; i<8; i++){
    for(let j=0; j<8; j++){
      for(let k=0; k<2*N; k++) AtA[i][j] += A[k][i] * A[k][j];
    }
    for(let k=0; k<2*N; k++) Atb[i] += A[k][i] * b[k];
  }

  for(let c=0; c<8; c++){
    let maxR=c, maxV=Math.abs(AtA[c][c]);
    for(let r=c+1; r<8; r++) if(Math.abs(AtA[r][c]) > maxV){ maxV=Math.abs(AtA[r][c]); maxR=r; }
    if(maxV < 1e-10) return null; 

    [AtA[c], AtA[maxR]] = [AtA[maxR], AtA[c]];
    [Atb[c], Atb[maxR]] = [Atb[maxR], Atb[c]];

    const div = AtA[c][c];
    for(let j=c; j<8; j++) AtA[c][j] /= div;
    Atb[c] /= div;

    for(let r=0; r<8; r++){
      if(r===c) continue;
      const mult = AtA[r][c];
      for(let j=c; j<8; j++) AtA[r][j] -= mult * AtA[c][j];
      Atb[r] -= mult * Atb[c];
    }
  }

  const hn = [...Atb, 1];
  
  const h = [
    hn[0]*s1/s2 + cx2*hn[6]*s1,
    hn[1]*s1/s2 + cx2*hn[7]*s1,
    (-hn[0]*s1*cx1 - hn[1]*s1*cy1 + hn[2])/s2 + cx2*(-hn[6]*s1*cx1 - hn[7]*s1*cy1 + 1),
    hn[3]*s1/s2 + cy2*hn[6]*s1,
    hn[4]*s1/s2 + cy2*hn[7]*s1,
    (-hn[3]*s1*cx1 - hn[4]*s1*cy1 + hn[5])/s2 + cy2*(-hn[6]*s1*cx1 - hn[7]*s1*cy1 + 1),
    hn[6]*s1,
    hn[7]*s1,
    -hn[6]*s1*cx1 - hn[7]*s1*cy1 + 1
  ];

  for(let i=0;i<9;i++) h[i] /= h[8];
  return h;
};

const apH=(h,x,y)=>{const w=h[6]*x+h[7]*y+h[8]||1e-10;return[(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];};

const doRansac=(p1,p2,thr=5,its=3000)=>{
  if(p1.length<4) return null;
  let bH=null,bN=0,bMask=[];
  const N=p1.length;
  for(let it=0;it<its;it++){
    const idx=[];
    while(idx.length<4){const r=Math.floor(Math.random()*N);if(!idx.includes(r))idx.push(r);}
    
    const H=dltN(idx.map(i=>p1[i]),idx.map(i=>p2[i]));
    if(!H) continue;
    
    let n=0; const mask=new Array(N).fill(false);
    for(let i=0;i<N;i++){
      const[px,py]=apH(H,p1[i][0],p1[i][1]);
      const dx=px-p2[i][0],dy=py-p2[i][1];
      if(Math.sqrt(dx*dx+dy*dy)<thr){mask[i]=true;n++;}
    }
    if(n>bN){bN=n;bH=H;bMask=mask;}
  }
  
  if(bN>=4){
    const inliers1=[], inliers2=[];
    for(let i=0;i<N;i++){
      if(bMask[i]){ inliers1.push(p1[i]); inliers2.push(p2[i]); }
    }
    const finalH = dltN(inliers1, inliers2);
    if(finalH) bH = finalH;
  }
  
  return bH?{H:bH,mask:bMask,inliers:bN}:null;
};

const warpImg=(srcData,sW,sH,H,dW,dH)=>{
  const[h0,h1,h2,h3,h4,h5,h6,h7,h8]=H;
  const det=h0*(h4*h8-h5*h7)-h1*(h3*h8-h5*h6)+h2*(h3*h7-h4*h6);
  if(Math.abs(det)<1e-10) return new Uint8ClampedArray(dW*dH*4);
  const inv=[(h4*h8-h5*h7)/det,(h2*h7-h1*h8)/det,(h1*h5-h2*h4)/det,
             (h5*h6-h3*h8)/det,(h0*h8-h2*h6)/det,(h2*h3-h0*h5)/det,
             (h3*h7-h4*h6)/det,(h1*h6-h0*h7)/det,(h0*h4-h1*h3)/det];
  const out=new Uint8ClampedArray(dW*dH*4);
  for(let y=0;y<dH;y++) for(let x=0;x<dW;x++){
    const iw=inv[6]*x+inv[7]*y+inv[8]||1e-10;
    const sx=(inv[0]*x+inv[1]*y+inv[2])/iw, sy=(inv[3]*x+inv[4]*y+inv[5])/iw;
    if(sx<0||sx>=sW-1||sy<0||sy>=sH-1) continue;
    const x0=Math.floor(sx),y0=Math.floor(sy),dx=sx-x0,dy=sy-y0;
    const oi=(y*dW+x)*4;
    for(let c=0;c<3;c++){
      out[oi+c]=Math.round(
        (1-dx)*(1-dy)*srcData[(y0*sW+x0)*4+c]+
        dx*(1-dy)*srcData[(y0*sW+x0+1)*4+c]+
        (1-dx)*dy*srcData[((y0+1)*sW+x0)*4+c]+
        dx*dy*srcData[((y0+1)*sW+x0+1)*4+c]
      );
    }
    out[oi+3]=255;
  }
  return out;
};


// ----------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------
function Histogram({imageData,label}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!imageData||!ref.current) return;
    const canvas=ref.current,ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);ctx.fillStyle="#06060e";ctx.fillRect(0,0,W,H);
    const r=new Array(256).fill(0),g=new Array(256).fill(0),b=new Array(256).fill(0);
    for(let i=0;i<imageData.data.length;i+=4){r[imageData.data[i]]++;g[imageData.data[i+1]]++;b[imageData.data[i+2]]++;}
    const mx=Math.max(arrMax(r),arrMax(g),arrMax(b))||1;
    [["#ff4d6d",r],["#06d6a0",g],["#4cc9f0",b]].forEach(([col,bins])=>{
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=0.85;
      for(let x=0;x<256;x++){const px=x*(W/256),py=H-2-(bins[x]/mx)*(H-6);x===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
      ctx.stroke();ctx.fillStyle=col;ctx.globalAlpha=0.1;ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    });
    ctx.fillStyle="rgba(255,255,255,0.3)";ctx.font="9px monospace";ctx.fillText(label||"",3,10);
  },[imageData,label]);
  return <canvas ref={ref} width={260} height={70} style={{width:"100%",borderRadius:3,border:"1px solid rgba(255,255,255,0.06)"}}/>;
}

class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  componentDidCatch(error,info){console.error("Module crash:",error,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16,color:"rgba(255,255,255,0.5)"}}>
          <div style={{fontSize:40}}>⚠️</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:13,color:"#f72585",letterSpacing:2}}>MODULE ERROR</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",maxWidth:400,textAlign:"center",lineHeight:1.7}}>
            {this.state.error?.message||"An unexpected error occurred in this module."}
          </div>
          <button onClick={()=>this.setState({hasError:false,error:null})}
            style={{background:"rgba(247,37,133,0.1)",border:"1px solid #f72585",color:"#f72585",
              padding:"8px 20px",cursor:"pointer",borderRadius:3,fontFamily:"monospace",fontSize:11,letterSpacing:2}}>
            ↺ RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RegistrationPanel({color, activeTopic}){
  const [img1,setImg1]=useState(null);
  const [img2,setImg2]=useState(null);
  const [busy,setBusy]=useState(false);
  const [log,setLog]=useState("");
  const [computed,setComputed]=useState(null); 
  
  const c1=useRef(null),c2=useRef(null);
  const cMatches=useRef(null);
  const cOverlay=useRef(null);
  const cRegistered=useRef(null);

  const loadImg=(file,setFn,ref)=>{
    const r=new FileReader();
    r.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=420,sc=Math.min(1,MAX/Math.max(img.width,img.height));
        const W=Math.round(img.width*sc),H=Math.round(img.height*sc);
        const cv=document.createElement("canvas");cv.width=W;cv.height=H;
        cv.getContext("2d").drawImage(img,0,0,W,H);
        const id=cv.getContext("2d").getImageData(0,0,W,H);
        setFn({data:new Uint8ClampedArray(id.data),W,H,id});
        if(ref.current){ref.current.width=W;ref.current.height=H;ref.current.getContext("2d").putImageData(id,0,0);}
      };img.src=e.target.result;
    };r.readAsDataURL(file);
  };

  const toGray=(data,W,H)=>{
    const g=new Float32Array(W*H);
    for(let i=0;i<W*H;i++) g[i]=0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2];
    return g;
  };

  const runAll=()=>{
    if(!img1||!img2){alert("Please upload both images first.");return;}
    setBusy(true); setLog("Step 1/4: Detecting fast dense corners...");
    setTimeout(()=>{
      try{
        const g1=toGray(img1.data,img1.W,img1.H);
        const g2=toGray(img2.data,img2.W,img2.H);
        const kps1=getCorners(g1,img1.W,img1.H,800);
        const kps2=getCorners(g2,img2.W,img2.H,800);
        setLog(`Step 2/4: Building Rotation-Invariant ZNCC Patches (${kps1.length}+${kps2.length} KP)...`);
        
        setTimeout(()=>{
          const ds1=kps1.map(({x,y})=>getDesc(g1,img1.W,img1.H,x,y));
          const ds2=kps2.map(({x,y})=>getDesc(g2,img2.W,img2.H,x,y));
          setLog("Step 3/4: Mutual Best-Match Filtering...");
          
          setTimeout(()=>{
            const matches=matchMutual(kps1,ds1,kps2,ds2);
            setLog(`Step 4/4: RANSAC + OpenCV-style DLT Polish (${matches.length} matches)...`);
            
            setTimeout(()=>{
              const p1=matches.map(({i})=>[kps1[i].x,kps1[i].y]);
              const p2=matches.map(({j})=>[kps2[j].x,kps2[j].y]);
              const res=matches.length>=4?doRansac(p1,p2,5,3000):null;
              
              let warpedData=null,ovData=null;
              const dW=img2.W,dH=img2.H;
              if(res){
                warpedData=warpImg(img1.data,img1.W,img1.H,res.H,dW,dH);
                ovData=new Uint8ClampedArray(dW*dH*4);
                for(let p=0;p<dW*dH;p++){
                  const oi=p*4;
                  if(warpedData[oi+3]>0){
                    ovData[oi]  =Math.round(warpedData[oi]  *0.5+img2.data[oi]  *0.5);
                    ovData[oi+1]=Math.round(warpedData[oi+1]*0.5+img2.data[oi+1]*0.5);
                    ovData[oi+2]=Math.round(warpedData[oi+2]*0.5+img2.data[oi+2]*0.5);
                    ovData[oi+3]=255;
                  } else {
                    ovData[oi]=img2.data[oi]; ovData[oi+1]=img2.data[oi+1];
                    ovData[oi+2]=img2.data[oi+2]; ovData[oi+3]=255;
                  }
                }
              }
              setComputed({kps1,kps2,matches,res,warpedData,ovData,dW,dH});
              setLog(`✓ Registration Complete. Found ${matches.length} Mutual Matches | ${res?res.inliers:"—"} Inliers.`);
              setBusy(false);
            }, 30);
          }, 30);
        }, 30);
      }catch(e){setLog("Error: "+e.message); setBusy(false);}
    },50);
  };

  const doReset=()=>{
    setImg1(null);setImg2(null);setComputed(null);setLog("");
    [c1,c2,cMatches,cOverlay,cRegistered].forEach(r=>{if(r.current){r.current.width=2;r.current.height=2;}});
  };

  useEffect(()=>{
    if(!computed) return;
    const{kps1,kps2,matches,res,warpedData,ovData,dW,dH}=computed;

    if(cMatches.current){
      const GAP=6,CW=img1.W+img2.W+GAP,CH=Math.max(img1.H,img2.H);
      cMatches.current.width=CW; cMatches.current.height=CH;
      const ctx=cMatches.current.getContext("2d");
      ctx.fillStyle="#06060e"; ctx.fillRect(0,0,CW,CH);
      ctx.putImageData(img1.id,0,Math.round((CH-img1.H)/2));
      ctx.putImageData(img2.id,img1.W+GAP,Math.round((CH-img2.H)/2));
      
      const show=matches.slice(0,100);
      show.forEach(({i,j},idx)=>{
        if(res && res.mask && !res.mask[idx]) return; 
        ctx.strokeStyle="rgba(0,255,170,0.85)";
        ctx.lineWidth=1.2;
        ctx.beginPath();
        ctx.moveTo(kps1[i].x,Math.round((CH-img1.H)/2)+kps1[i].y);
        ctx.lineTo(img1.W+GAP+kps2[j].x,Math.round((CH-img2.H)/2)+kps2[j].y);
        ctx.stroke();
      });
      ctx.fillStyle="#00ffaa";
      show.forEach(({i,j},idx)=>{
        if(res && res.mask && !res.mask[idx]) return;
        ctx.beginPath();ctx.arc(kps1[i].x,Math.round((CH-img1.H)/2)+kps1[i].y,3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(img1.W+GAP+kps2[j].x,Math.round((CH-img2.H)/2)+kps2[j].y,3,0,Math.PI*2);ctx.fill();
      });
    }

    if(cOverlay.current && ovData){
      cOverlay.current.width=dW; cOverlay.current.height=dH;
      cOverlay.current.getContext("2d").putImageData(new ImageData(ovData,dW,dH),0,0);
    }

    if(cRegistered.current && warpedData){
      cRegistered.current.width=dW; cRegistered.current.height=dH;
      const ctx=cRegistered.current.getContext("2d");
      ctx.fillStyle="#000000"; ctx.fillRect(0,0,dW,dH);
      ctx.putImageData(new ImageData(warpedData,dW,dH),0,0);
    }
  },[computed]);

  const LBL={fontSize:9,letterSpacing:3,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",marginBottom:5};
  const BOX={background:"#06060e",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",minHeight:110};

  return(
    <div style={{padding:14,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={runAll} disabled={busy} style={{background:computed?"rgba(6,214,160,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${computed?color:"rgba(255,255,255,0.2)"}`,color:computed?color:"rgba(255,255,255,0.5)",padding:"8px 16px",cursor:"pointer",borderRadius:3,fontFamily:"monospace",fontSize:11,letterSpacing:1}}>
          {busy?"⏳ Computing...":"⚡ Run Registration"}
        </button>
        <button onClick={doReset} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.35)",padding:"8px 14px",cursor:"pointer",borderRadius:3,fontFamily:"monospace",fontSize:11}}>↺ Reset</button>
      </div>
      {log&&<div style={{fontSize:10,color:computed?"#06d6a0":"#f77f00",background:computed?"rgba(6,214,160,0.06)":"rgba(247,127,0,0.06)",border:`1px solid ${computed?"rgba(6,214,160,0.2)":"rgba(247,127,0,0.2)"}`,borderRadius:3,padding:"5px 10px"}}>{log}</div>}

      {!computed && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {label:"REFERENCE IMAGE",ref:c1,img:img1,set:setImg1,cl:color},
          {label:"MOVING IMAGE",   ref:c2,img:img2,set:setImg2,cl:"#4cc9f0"},
        ].map(({label,ref,img,set,cl})=>(
          <div key={label}>
            <div style={LBL}>{label}</div>
            <div style={{...BOX,border:`1px solid ${cl}33`,minHeight:150}}>
              <canvas ref={ref} style={{maxWidth:"100%",maxHeight:190,display:"block"}}/>
            </div>
            <label style={{display:"block",marginTop:5,textAlign:"center",background:`${cl}0f`,border:`1px solid ${cl}44`,color:cl,padding:"6px",cursor:"pointer",borderRadius:3,fontFamily:"monospace",fontSize:10,letterSpacing:1}}>
              ⬆ {img?"Change Image":"Upload Image"}
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&loadImg(e.target.files[0],set,ref)}/>
            </label>
          </div>
        ))}
      </div>}

      {computed && <>
        <div style={{display:"flex", flexDirection:"column", gap:15, marginTop:10}}>
          <div>
            <div style={{...LBL, color: "#00ffaa", fontWeight: "bold"}}>1. KEYPOINT MATCHES (INLIERS ONLY: {computed.res?computed.res.inliers:"0"})</div>
            <div style={BOX}><canvas ref={cMatches} style={{maxWidth:"100%",display:"block"}}/></div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div>
              <div style={{...LBL, color: "#4cc9f0", fontWeight: "bold"}}>2. OVERLAPPING IMAGE (REFERENCE OVER MOVING)</div>
              <div style={BOX}><canvas ref={cOverlay} style={{maxWidth:"100%",maxHeight:350,display:"block"}}/></div>
            </div>
            <div>
              <div style={{...LBL, color: "#f72585", fontWeight: "bold"}}>3. EXTRACTED REGISTERED IMAGE</div>
              <div style={BOX}><canvas ref={cRegistered} style={{maxWidth:"100%",maxHeight:350,display:"block"}}/></div>
            </div>
          </div>
        </div>
      </>}
    </div>
  );
}


// ----------------------------------------------------------
// MAIN APP
// ----------------------------------------------------------
const REG_SPECIAL=["Unified Registration"];
const MATCH_SPECIAL=["BF Match Viz"];
const PARAM_MAP={
  "Gamma":[{key:"gamma",label:"gamma",min:0.1,max:3,step:0.05}],
  "Bit-plane Slicing":[{key:"plane",label:"Plane",min:0,max:7,step:1}],
  "Thresholding":[{key:"thresh",label:"T",min:0,max:255,step:1}],
  "Sigmoid":[{key:"k",label:"k",min:0.01,max:0.2,step:0.01}],
  "Global Threshold":[{key:"thresh",label:"T",min:0,max:255,step:1}],
  "Ideal LP":[{key:"d0",label:"D0",min:5,max:120,step:1}],
  "Butterworth LP":[{key:"d0",label:"D0",min:5,max:120,step:1},{key:"n",label:"Order",min:1,max:5,step:1}],
  "Gaussian LP":[{key:"d0",label:"D0",min:5,max:120,step:1}],
  "Ideal HP":[{key:"d0",label:"D0",min:5,max:120,step:1}],
  "Butterworth HP":[{key:"d0",label:"D0",min:5,max:120,step:1},{key:"n",label:"Order",min:1,max:5,step:1}],
  "Gaussian HP":[{key:"d0",label:"D0",min:5,max:120,step:1}],
  "Band Reject":[{key:"d0",label:"Center",min:10,max:100,step:1}],
  "Band Pass":[{key:"d0",label:"Center",min:10,max:100,step:1}],
  "Add Gaussian Noise":[{key:"sigma",label:"sigma",min:1,max:80,step:1}],
  "Rotation":[{key:"angle",label:"deg",min:-90,max:90,step:1}],
  "Scaling":[{key:"scale",label:"x",min:0.4,max:3,step:0.1}],
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
  const [diffMode,setDiffMode]=useState(false);
  const [webcamOn,setWebcamOn]=useState(false);
  const [webcamErr,setWebcamErr]=useState(null);
  const [liveMode,setLiveMode]=useState('sobel'); 
  const [quizMode,setQuizMode]=useState(false);
  const [quizQ,setQuizQ]=useState(null);
  const [quizScore,setQuizScore]=useState({right:0,wrong:0});
  const [quizFeedback,setQuizFeedback]=useState(null);
  const [quizImgUrl,setQuizImgUrl]=useState(null);
  const [mobTab,setMobTab]=useState('canvas'); 
  
  const origRef=useRef(null),procRef=useRef(null),fileRef=useRef(null),webcamRef=useRef(null),diffRef=useRef(null),streamRef=useRef(null),camFileRef=useRef(null),liveCanvasRef=useRef(null),animFrameRef=useRef(null);

  const isSpecialReg=activeMod.id==="registration"&&REG_SPECIAL.includes(activeTopic);
  const showRegPanel=isSpecialReg;

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
    const imageData=ctx.getImageData(0,0,320,320);
    setOrigData(imageData);
    if(origRef.current){
      origRef.current.width=320;origRef.current.height=320;
      origRef.current.getContext("2d").putImageData(imageData,0,0);
    }
  },[]);

  useEffect(()=>{
    if(!origData||!origRef.current) return;
    origRef.current.width=origData.width;origRef.current.height=origData.height;
    origRef.current.getContext("2d").putImageData(origData,0,0);
  },[origData]);

  const origCanvasRef = useCallback((node)=>{
    origRef.current = node;
    if(node && origData){
      node.width=origData.width;
      node.height=origData.height;
      node.getContext("2d").putImageData(origData,0,0);
    }
  },[origData]);

  useEffect(()=>{
    if(!origData||showRegPanel) return;
    try{
      const result=processImg(origData,activeMod.id,activeTopic,params);
      setProcData(result);
      if(procRef.current){procRef.current.width=result.width;procRef.current.height=result.height;procRef.current.getContext("2d").putImageData(result,0,0);}
    }catch(err){
      if(procRef.current){
        const c=procRef.current;c.width=320;c.height=160;
        const ctx=c.getContext("2d");
        ctx.fillStyle="#0a0a1a";ctx.fillRect(0,0,320,160);
        ctx.fillStyle="#f72585";ctx.font="12px monospace";
        ctx.fillText("⚠ Operation error: "+err.message.slice(0,40),10,80);
      }
    }
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

  useEffect(()=>()=>{if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());},[]);

  const toggleWebcam=useCallback(()=>{
    if(webcamOn){
      if(animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      streamRef.current=null;
      if(webcamRef.current){webcamRef.current.srcObject=null;}
      setWebcamOn(false);setWebcamErr(null);
      return;
    }
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      setWebcamErr("Camera API not available.");
      setWebcamOn(true);
      return;
    }
    navigator.mediaDevices.getUserMedia({video:true})
      .then(stream=>{
        streamRef.current=stream;
        if(webcamRef.current){
          webcamRef.current.srcObject=stream;
          webcamRef.current.play().catch(()=>{});
        }
        setWebcamErr(null);
        setWebcamOn(true);
      })
      .catch(err=>{
        setWebcamErr(err.name+": "+err.message);
        setWebcamOn(true);
      });
  },[webcamOn]);

  useEffect(()=>{
    if(!webcamOn){
      if(animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const KX=[[-1,0,1],[-2,0,2],[-1,0,1]], KY=[[-1,-2,-1],[0,0,0],[1,2,1]];
    const offscreen=document.createElement('canvas');
    const render=()=>{
      const video=webcamRef.current, lc=liveCanvasRef.current;
      if(!video||!lc||!video.srcObject||video.readyState<2){animFrameRef.current=requestAnimationFrame(render);return;}
      const W=video.videoWidth||320,H=video.videoHeight||240;
      offscreen.width=W;offscreen.height=H;
      lc.width=W;lc.height=H;
      const octx=offscreen.getContext('2d');
      octx.drawImage(video,0,0,W,H);
      const frame=octx.getImageData(0,0,W,H);
      const N=W*H, gray=new Float32Array(N);
      for(let i=0;i<N;i++) gray[i]=0.299*frame.data[i*4]+0.587*frame.data[i*4+1]+0.114*frame.data[i*4+2];
      const out=new Uint8ClampedArray(frame.data);
      if(liveMode==='sobel'||liveMode==='color'){
        const gx=new Float32Array(N),gy=new Float32Array(N);
        for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
          let sx=0,sy=0;
          for(let ky=0;ky<3;ky++) for(let kx=0;kx<3;kx++){
            const v=gray[(y+ky-1)*W+(x+kx-1)];
            sx+=v*KX[ky][kx];sy+=v*KY[ky][kx];
          }
          gx[y*W+x]=sx;gy[y*W+x]=sy;
        }
        for(let i=0;i<N;i++){
          const mag=Math.min(255,Math.sqrt(gx[i]*gx[i]+gy[i]*gy[i]));
          if(liveMode==='sobel'){
            out[i*4]=Math.round(mag);out[i*4+1]=Math.round(mag);out[i*4+2]=Math.round(mag);
          } else {
            const angle=(Math.atan2(gy[i],gx[i])+Math.PI)/(2*Math.PI);
            out[i*4]=Math.round(angle*mag);
            out[i*4+1]=Math.round((1-angle)*mag*0.8);
            out[i*4+2]=Math.round(mag*(0.5+angle*0.5));
          }
          out[i*4+3]=255;
        }
      }
      lc.getContext('2d').putImageData(new ImageData(out,W,H),0,0);
      animFrameRef.current=requestAnimationFrame(render);
    };
    animFrameRef.current=requestAnimationFrame(render);
    return ()=>{if(animFrameRef.current) cancelAnimationFrame(animFrameRef.current);};
  },[webcamOn,liveMode]);

  const captureWebcam=useCallback(()=>{
    if(!webcamRef.current) return;
    const c=document.createElement("canvas");c.width=320;c.height=320;
    c.getContext("2d").drawImage(webcamRef.current,0,0,320,320);
    setOrigData(c.getContext("2d").getImageData(0,0,320,320));
  },[]);

  useEffect(()=>{
    if(!diffMode||!origData||!procData||!diffRef.current) return;
    const c=diffRef.current;c.width=origData.width;c.height=origData.height;
    const ctx=c.getContext("2d");
    const diff=new Uint8ClampedArray(origData.width*origData.height*4);
    for(let i=0;i<origData.width*origData.height;i++){
      diff[i*4]=Math.abs(origData.data[i*4]-procData.data[i*4]);
      diff[i*4+1]=Math.abs(origData.data[i*4+1]-procData.data[i*4+1]);
      diff[i*4+2]=Math.abs(origData.data[i*4+2]-procData.data[i*4+2]);
      diff[i*4+3]=255;
    }
    ctx.putImageData(new ImageData(diff,origData.width,origData.height),0,0);
  },[diffMode,origData,procData]);

  const exportImage=useCallback(()=>{
    if(!procRef.current) return;
    const a=document.createElement("a");a.download=`${activeMod.id}_${activeTopic.replace(/\s/g,"_")}.png`;
    a.href=procRef.current.toDataURL("image/png");a.click();
  },[activeMod,activeTopic]);

  const startQuiz=useCallback(()=>{
    const allOps=MODULES.flatMap(m=>m.topics.map(t=>({mod:m,topic:t})));
    const q=allOps[Math.floor(Math.random()*allOps.length)];
    const correct=q.mod.label+" > "+q.topic;
    const others=allOps.filter(o=>o.topic!==q.topic).sort(()=>Math.random()-0.5).slice(0,3).map(o=>o.mod.label+" > "+o.topic);
    const choices=[correct,...others].sort(()=>Math.random()-0.5);
    setQuizQ({...q,correct,choices});setQuizFeedback(null);setQuizImgUrl(null);
  },[]);

  const answerQuiz=useCallback((choice)=>{
    if(!quizQ) return;
    const ok=choice===quizQ.correct;
    setQuizScore(s=>({right:s.right+(ok?1:0),wrong:s.wrong+(ok?0:1)}));
    setQuizFeedback({ok,correct:quizQ.correct});
    setTimeout(()=>startQuiz(),1500);
  },[quizQ,startQuiz]);

  useEffect(()=>{
    if(!quizQ) return;
    const src=origData||{width:160,height:160,data:new Uint8ClampedArray(160*160*4).fill(180)};
    try{
      const tmp=processImg(src,quizQ.mod.id,quizQ.topic,{gamma:1,thresh:128,plane:7,d0:40,n:2,sigma:20,k:0.05,angle:15,scale:1.2,tx:20,ty:20,wavThresh:20});
      const c=document.createElement("canvas");c.width=tmp.width;c.height=tmp.height;
      c.getContext("2d").putImageData(tmp,0,0);
      setQuizImgUrl(c.toDataURL());
    }catch(e){setQuizImgUrl(null);}
  },[quizQ,origData]);

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
        .cw{background:#06060e;border:1px solid rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:120px;}
        canvas{max-width:100%;max-height:300px;display:block;}
        .lbl{font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.22);text-transform:uppercase;margin-bottom:6px;margin-top:12px;}
        @keyframes fu{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu 0.25s ease forwards;}
        .tr{cursor:pointer;padding:4px 0;display:flex;align-items:center;gap:6px;font-size:11px;transition:color 0.15s;}
        .tr:hover{color:white;}
        .ic{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:3px;padding:10px 12px;}

        /* ── MOBILE RESPONSIVE ─────────────────────────────────────────── */
        .mob-nav{display:none;}
        .mob-overlay{display:none;}

        @media(max-width:768px){
          .desktop-sidebar{display:none !important;}
          .desktop-left{display:none !important;}
          .desktop-tools{display:none !important;}
          .mob-nav{
            display:flex !important;
            position:fixed;bottom:0;left:0;right:0;
            height:60px; background:#06060e;
            border-top:1px solid rgba(255,255,255,0.15);
            z-index:9999; align-items:stretch; padding:0 4px;
            box-shadow:0 -4px 20px rgba(0,0,0,0.6);
          }
          .mob-nav-btn{
            flex:1;background:none;border:none; cursor:pointer;
            display:flex;flex-direction:column; align-items:center;justify-content:center;
            gap:3px; font-size:7.5px;letter-spacing:0.8px; color:rgba(255,255,255,0.3);
            font-family:'Share Tech Mono',monospace; padding:6px 2px; transition:all 0.15s;
            border-top:2px solid transparent;
          }
          .mob-nav-btn.a{color:var(--mc,#4cc9f0);border-top-color:var(--mc,#4cc9f0);}
          .mob-nav-btn span.ico{font-size:20px;line-height:1;}
          .mob-overlay{
            display:none; position:fixed;top:54px;left:0;right:0;bottom:60px;
            background:#06060e; z-index:500; overflow-y:auto; padding:14px 14px 20px;
            animation:fu 0.18s ease; border-top:1px solid rgba(255,255,255,0.06);
          }
          .mob-overlay.open{display:block;}
          .mob-header{padding:8px 12px !important; flex-wrap:wrap; gap:6px !important; padding-bottom:8px !important;}
          .mob-title-block{flex:1;min-width:0;}
          .mob-tool-row{display:flex;flex-wrap:wrap; gap:5px;width:100%; margin-top:2px;}
          .mob-tool-row .ub{padding:7px 10px !important; font-size:10px !important; letter-spacing:1px !important; flex:1;min-width:70px; text-align:center;}
          .mob-body{padding-bottom:68px !important;overflow-y:auto;}
          canvas{max-height:180px !important;}
          .cw{min-height:100px;}
          .ch{font-size:12px !important; padding:8px 13px !important; margin:4px !important;}
          .sl{height:6px !important;}
          .sl::-webkit-slider-thumb{width:22px !important; height:22px !important;}
          .canvas-grid{grid-template-columns:1fr 1fr !important; gap:8px !important;}
        }
        @media(max-width:480px){
          .canvas-grid{grid-template-columns:1fr !important;}
          canvas{max-height:220px !important;}
          .mob-nav-btn{font-size:7px;}
          .mob-nav-btn span.ico{font-size:17px;}
        }
        @media(min-width:769px){
          .mob-nav{display:none !important;}
          .mob-overlay{display:none !important;}
          .mob-tool-row{display:none !important;}
          .desktop-tools{display:flex !important;}
          .canvas-grid{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      {/* QUIZ OVERLAY */}
      {quizMode&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:"#0a0a1a",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"32px",maxWidth:560,width:"90%"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:14,letterSpacing:3,color:"rgba(255,255,255,0.4)"}}>QUIZ MODE</div>
            <div style={{display:"flex",gap:16}}>
              <span style={{color:"#06d6a0",fontSize:13}}>✓ {quizScore.right}</span>
              <span style={{color:"#f72585",fontSize:13}}>✗ {quizScore.wrong}</span>
              <button style={{background:"none",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.5)",padding:"4px 12px",cursor:"pointer",borderRadius:3,fontFamily:"monospace"}} onClick={()=>{setQuizMode(false);setQuizQ(null);}}>EXIT</button>
            </div>
          </div>
          {quizQ&&<>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.3)",marginBottom:8}}>IDENTIFY THIS MODULE & OPERATION:</div>
              <div style={{background:"#06060e",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:16,textAlign:"center"}}>
                {quizImgUrl?<img src={quizImgUrl} style={{maxWidth:240,maxHeight:160,borderRadius:4}}/>:<div style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>Loading...</div>}
              </div>
            </div>
            {quizFeedback&&<div style={{marginBottom:16,padding:"10px 16px",borderRadius:4,background:quizFeedback.ok?"rgba(6,214,160,0.12)":"rgba(247,37,133,0.12)",border:`1px solid ${quizFeedback.ok?"#06d6a0":"#f72585"}`,color:quizFeedback.ok?"#06d6a0":"#f72585",fontSize:12}}>
              {quizFeedback.ok?"Correct!":"Wrong — correct: "+quizFeedback.correct}
            </div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {quizQ.choices.map(c=><button key={c} onClick={()=>answerQuiz(c)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",padding:"10px 14px",cursor:"pointer",borderRadius:4,fontFamily:"monospace",fontSize:11,textAlign:"left",transition:"all 0.15s"}}>{c}</button>)}
            </div>
          </>}
          {!quizQ&&<button onClick={startQuiz} style={{width:"100%",padding:"14px",background:"rgba(67,97,238,0.15)",border:"1px solid #4361ee",color:"#4361ee",cursor:"pointer",borderRadius:4,fontFamily:"monospace",fontSize:13,letterSpacing:2}}>START QUIZ</button>}
        </div>
      </div>}

      {/* SIDEBAR */}
      <div className="desktop-sidebar" style={{width:sidebar?248:50,minWidth:sidebar?248:50,background:"#06060e",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",transition:"width 0.2s",overflow:"hidden"}}>
        <div style={{padding:"13px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18,flexShrink:0}}>🧠</span>
          {sidebar&&<div style={{fontFamily:"'Orbitron',monospace",fontSize:9.5,fontWeight:600,letterSpacing:2,color:"#4cc9f0",lineHeight:1.4}}>IMAGE<br/>PROCESSING<br/><span style={{fontSize:8,color:"rgba(76,201,240,0.35)"}}>COMPLETE TOOLKIT</span></div>}
          <button onClick={()=>setSidebar(v=>!v)} style={{marginLeft:"auto",background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:13,flexShrink:0,padding:4}}>{sidebar?"<<":">>"}</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"5px 0"}}>
          {MODULES.map(mod=>(
            <button key={mod.id} className={`mb${activeMod.id===mod.id?" a":""}`} style={{"--c":mod.color}} onClick={()=>selMod(mod)}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <span style={{fontSize:15,flexShrink:0}}>{mod.icon}</span>
                {sidebar&&<span style={{fontSize:10,color:activeMod.id===mod.id?mod.color:"rgba(255,255,255,0.42)",letterSpacing:0.3,lineHeight:1.35}}>{mod.label}</span>}
              </div>
            </button>
          ))}
        </div>
        {sidebar&&<div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",fontSize:9,color:"rgba(255,255,255,0.12)",letterSpacing:1}}>{MODULES.length} MODULES * {MODULES.reduce((a,m)=>a+m.topics.length,0)} OPERATIONS</div>}
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:12,background:"#06060e",flexShrink:0}} className="mob-header">
          <span style={{fontSize:20}}>{activeMod.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:13,fontWeight:600,color:activeMod.color,letterSpacing:1}}>{activeMod.label}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:1}}>{MODULES.length} modules · {activeMod.topics.length} ops</div>
          </div>
          {!showRegPanel&&<div className="desktop-tools" style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <label htmlFor="mainUpload" className="ub" style={{cursor:"pointer"}}>⬆ UPLOAD</label>
            <input id="mainUpload" ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleUpload}/>
            <button className="ub" onClick={toggleWebcam} style={{padding:"7px 10px",fontSize:10,background:webcamOn?"rgba(247,37,133,0.15)":"rgba(76,201,240,0.07)",borderColor:webcamOn?"#f72585":"rgba(76,201,240,0.3)",color:webcamOn?"#f72585":"#4cc9f0"}}>{webcamOn?"🔴 STOP":"📷 CAM"}</button>
            <button className="ub" onClick={exportImage} style={{padding:"7px 10px",fontSize:10,borderColor:"rgba(6,214,160,0.3)",color:"#06d6a0",background:"rgba(6,214,160,0.07)"}}>💾 SAVE</button>
            <button className="ub" onClick={()=>setDiffMode(d=>!d)} style={{padding:"7px 10px",fontSize:10,borderColor:diffMode?"#f77f00":"rgba(247,127,0,0.3)",color:diffMode?"#f77f00":"rgba(247,127,0,0.6)",background:diffMode?"rgba(247,127,0,0.12)":"transparent"}}>🔀 {diffMode?"DIFF ON":"DIFF"}</button>
            <button className="ub" onClick={()=>{setQuizMode(true);startQuiz();}} style={{padding:"7px 10px",fontSize:10,borderColor:"rgba(67,97,238,0.4)",color:"#4361ee",background:"rgba(67,97,238,0.07)"}}>🧩 QUIZ</button>
          </div>}
          {/* Mobile tool row - only shows on mobile */}
          {!showRegPanel&&<div className="mob-tool-row">
            <label htmlFor="mobUpload" className="ub" style={{cursor:"pointer",textAlign:"center",flex:1}}>⬆ IMG</label>
            <input id="mobUpload" type="file" accept="image/*" style={{display:"none"}} onChange={handleUpload}/>
            <button className="ub" onClick={toggleWebcam} style={{flex:1,background:webcamOn?"rgba(247,37,133,0.15)":undefined,borderColor:webcamOn?"#f72585":undefined,color:webcamOn?"#f72585":undefined}}>{webcamOn?"🔴 OFF":"📷 CAM"}</button>
            <button className="ub" onClick={exportImage} style={{flex:1,borderColor:"rgba(6,214,160,0.3)",color:"#06d6a0",background:"rgba(6,214,160,0.07)"}}>💾</button>
            <button className="ub" onClick={()=>setDiffMode(d=>!d)} style={{flex:1,borderColor:diffMode?"#f77f00":"rgba(247,127,0,0.3)",color:diffMode?"#f77f00":"rgba(247,127,0,0.6)",background:diffMode?"rgba(247,127,0,0.12)":"transparent"}}>🔀</button>
            <button className="ub" onClick={()=>{setQuizMode(true);startQuiz();}} style={{flex:1,borderColor:"rgba(67,97,238,0.4)",color:"#4361ee",background:"rgba(67,97,238,0.07)"}}>🧩</button>
          </div>}
        </div>

        {/* Body */}
        <div className="mob-body" style={{flex:1,display:"flex",overflow:"hidden"}}>
          {/* LEFT: topics + params + theory */}
          <div className="desktop-left" style={{width:260,minWidth:260,borderRight:"1px solid rgba(255,255,255,0.05)",padding:"12px",overflowY:"auto",background:"#070713",flexShrink:0}}>
            <div className="lbl" style={{marginTop:0}}>Operations</div>
            <div>{activeMod.topics.map(t=>(
              <span key={t} className={`ch${activeTopic===t?" a":""}`}
                style={{"--c":activeMod.color,"--cb":activeMod.color+"1a"}}
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
                  <input type="range" className="sl" style={{"--c":activeMod.color}}
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
                  <span style={{fontSize:9}}>{theory===k?"v":">>"}</span><span>{k}</span>
                </div>
                {theory===k&&<div className="tb fu">{v}</div>}
              </div>
            ))}
          </div>

          {/* RIGHT: main content */}
          <div style={{flex:1,padding:"14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}} className="fu mob-body">

            {showRegPanel ? (
              <ErrorBoundary key={activeMod.id+activeTopic}>
                <RegistrationPanel color={activeMod.color} activeTopic={activeTopic}/>
              </ErrorBoundary>
            ) : (
              <>
                <div style={{display:webcamOn?"block":"none",marginBottom:12,background:"#06060e",border:"1px solid rgba(247,37,133,0.3)",borderRadius:4,padding:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                    <div className="lbl" style={{marginTop:0,color:"#f72585"}}>📷 LIVE WEBCAM</div>
                    {webcamErr&&<div style={{fontSize:10,color:"#f72585"}}>{webcamErr}</div>}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {[['sobel','⬜ SOBEL'],['color','🌈 NEON'],['capture','🎨 COLOR']].map(([m,label])=>(
                        <button key={m} onClick={()=>setLiveMode(m)} style={{fontSize:10,padding:"4px 9px",borderRadius:2,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${liveMode===m?"#f72585":"rgba(255,255,255,0.15)"}`,background:liveMode===m?"rgba(247,37,133,0.15)":"transparent",color:liveMode===m?"#f72585":"rgba(255,255,255,0.5)",transition:"all 0.15s"}}>{label}</button>
                      ))}
                      <button className="ub" style={{fontSize:10,padding:"4px 10px",borderColor:"rgba(6,214,160,0.4)",color:"#06d6a0"}} onClick={captureWebcam}>⚡ CAPTURE</button>
                    </div>
                  </div>
                  <video ref={webcamRef} autoPlay playsInline muted style={{display:"none"}}/>
                  <div style={{display:"flex",justifyContent:"center",background:"#000",borderRadius:3,overflow:"hidden",position:"relative"}}>
                    <canvas ref={liveCanvasRef} style={{maxWidth:"100%",maxHeight:240,display:"block"}}/>
                    <div style={{position:"absolute",top:6,left:8,fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.4)",pointerEvents:"none"}}>
                      {liveMode==='sobel'?"LIVE SOBEL EDGE":liveMode==='color'?"LIVE NEON EDGE":"LIVE COLOR FEED"}
                    </div>
                  </div>
                </div>

                <div className="canvas-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <div className="lbl" style={{marginTop:0}}>Original</div>
                    <div className="cw"><canvas ref={origCanvasRef}/></div>
                    <Histogram imageData={origData} label="Original"/>
                  </div>
                  <div>
                    <div className="lbl" style={{marginTop:0,color:activeMod.color}}>{activeTopic}</div>
                    <div className="cw"><canvas ref={procRef}/></div>
                    <Histogram imageData={procData} label="Processed"/>
                  </div>
                </div>

                {diffMode&&<div style={{marginTop:8}}>
                  <div className="lbl" style={{color:"#f77f00"}}>🔀 DIFFERENCE MAP (|Original - Processed|)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"start"}}>
                    <div style={{background:"#06060e",border:"1px solid rgba(247,127,0,0.3)",borderRadius:4,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",minHeight:100}}>
                      <canvas ref={diffRef} style={{maxWidth:"100%",maxHeight:260,display:"block"}}/>
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",lineHeight:1.8,padding:12,background:"rgba(247,127,0,0.04)",border:"1px solid rgba(247,127,0,0.15)",borderRadius:4}}>
                      <div style={{color:"#f77f00",marginBottom:6,fontSize:10,letterSpacing:2}}>DIFF ANALYSIS</div>
                      Bright pixels indicate large differences between original and processed image. Dark areas are unchanged regions. Useful for:<br/>
                      • Visualizing filter effects<br/>
                      • Quality assessment<br/>
                      • Noise pattern analysis
                    </div>
                  </div>
                </div>}

                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}} className="mob-info-grid">
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
      
      {/* ── MOBILE BOTTOM NAV ─────────────────────────────── */}
      <nav className="mob-nav" style={{"--mc":activeMod.color}}>
        {[
          {id:'modules', ico:'🧠', label:'MODULES'},
          {id:'ops',     ico:activeMod.icon, label:'OPS'},
          {id:'canvas',  ico:'🖼️', label:'CANVAS'},
          {id:'theory',  ico:'📖', label:'THEORY'},
        ].map(tab=>(
          <button key={tab.id} className={`mob-nav-btn${mobTab===tab.id?' a':''}`}
            onClick={()=>setMobTab(t=>t===tab.id&&tab.id!=='canvas'?'canvas':tab.id)}>
            <span className="ico">{tab.ico}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── MOBILE OVERLAYS ─────────────────────────── */}
      <div className={`mob-overlay${mobTab==='modules'?' open':''}`}>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:10,color:"#4cc9f0",letterSpacing:2,marginBottom:12}}>SELECT MODULE</div>
        {MODULES.map(mod=>(
          <button key={mod.id} onClick={()=>{selMod(mod);setMobTab('ops');}}
            style={{width:"100%",background:activeMod.id===mod.id?"rgba(255,255,255,0.07)":"transparent",
              border:"none",borderLeft:`3px solid ${activeMod.id===mod.id?mod.color:"transparent"}`,
              color:activeMod.id===mod.id?mod.color:"rgba(255,255,255,0.5)",
              padding:"12px 14px",cursor:"pointer",textAlign:"left",
              fontFamily:"'Share Tech Mono',monospace",fontSize:12,
              display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
            <span style={{fontSize:20}}>{mod.icon}</span>
            {mod.label}
          </button>
        ))}
      </div>

      <div className={`mob-overlay${mobTab==='ops'?' open':''}`}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <span style={{fontSize:22}}>{activeMod.icon}</span>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:activeMod.color,letterSpacing:1}}>{activeMod.label}</div>
        </div>
        <div style={{marginBottom:16}}>
          {activeMod.topics.map(t=>(
            <span key={t} className={`ch${activeTopic===t?' a':''}`}
              style={{"--c":activeMod.color,"--cb":activeMod.color+"1a"}}
              onClick={()=>{setActiveTopic(t);setMobTab('canvas');}}>
              {t}
            </span>
          ))}
        </div>
        {curParams.length>0&&<>
          <div className="lbl" style={{marginTop:0}}>Parameters</div>
          {curParams.map(p=>(
            <div key={p.key} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{p.label}</span>
                <span style={{fontSize:11,color:activeMod.color}}>{params[p.key]}</span>
              </div>
              <input type="range" className="sl" style={{"--c":activeMod.color}}
                min={p.min} max={p.max} step={p.step} value={params[p.key]||p.min}
                onChange={e=>setParams(prev=>({...prev,[p.key]:parseFloat(e.target.value)}))}/>
            </div>
          ))}
        </>}
      </div>

      <div className={`mob-overlay${mobTab==='theory'?' open':''}`}>
        <div className="lbl" style={{marginTop:0}}>Theory — {activeMod.label}</div>
        {Object.entries(activeMod.theory||{}).map(([k,v])=>(
          <div key={k} style={{marginBottom:8}}>
            <div onClick={()=>setTheory(theory===k?null:k)}
              style={{cursor:"pointer",padding:"10px 12px",background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.07)",borderRadius:3,
                color:theory===k?activeMod.color:"rgba(255,255,255,0.6)",fontSize:12}}>
              {theory===k?"▼":"▶"} {k}
            </div>
            {theory===k&&<div style={{padding:"10px 12px",background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.05)",borderTop:"none",
              fontSize:11,lineHeight:1.8,color:"rgba(255,255,255,0.55)"}}>
              {v}
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}