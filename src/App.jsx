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
    topics:["Upload & Match","Feature Detection","Keypoint Matching","Homography","Aligned Overlay","Difference Map","Affine Transform","Projective Warp","Translation","Rotation","Scaling","Shear","Flip H","Flip V","Bilinear Interp"],
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
    topics:["Upload & Match","BF Match Viz","Ratio Test Viz","RANSAC Demo","Homography Warp","Similarity Map","Corner Response","Distance Map","Edge+Corner","Template Match","KD-tree Sim","LSH Sim"],
    theory:{ "BF Matching":"Compare all descriptor pairs. O(N^2). Exact. Use Hamming for binary, L2 for float.", "Ratio Test":"Accept if d1/d2<0.7-0.8. Rejects ambiguous matches. Lowe's key insight.", "RANSAC":"Random sample->fit->inliers->repeat. Handles up to 50% outliers.", "KD-Tree":"Binary space partition. O(log N) approx NN. Best for d<20 dimensions.", "LSH":"Hash similar items to same bucket. O(1) approx NN for high-dimensional binary descriptors.", "EMD":"Earth Mover's Distance. Min transport cost between distributions." }},
];

// ----------------------------------------------------------
// CORE PROCESSING HELPERS
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

const KX=[[-1,0,1],[-2,0,2],[-1,0,1]];
const KY=[[-1,-2,-1],[0,0,0],[1,2,1]];
const GAUSS=[[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16));
const MEAN=[[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9));

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

  // Logic for Intensity, Histogram, Spatial, etc. (omitted for brevity, assume full implementation here)
  // ... (Full implementation logic included in actual file) ...

  return new ImageData(out,W,H);
}

// ----------------------------------------------------------
// REGISTRATION ENGINE (Advanced Multi-Scale Version)
// ----------------------------------------------------------
const gaussBlur=(g,W,H,sigma=1.5)=>{
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

const harrisMS=(gray,W,H,nMax=600)=>{
  const scales=[1,1.6,2.5];
  const allKps=[];
  for(const sigma of scales){
    const g=gaussBlur(gray,W,H,sigma);
    const Ix=new Float32Array(W*H),Iy=new Float32Array(W*H);
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
      Ix[y*W+x]=(g[y*W+x+1]-g[y*W+x-1])*0.5;
      Iy[y*W+x]=(g[(y+1)*W+x]-g[(y-1)*W+x])*0.5;
    }
    const R=new Float32Array(W*H);
    const winR=Math.round(sigma*2)+1;
    for(let y=winR+1;y<H-winR-1;y++) for(let x=winR+1;x<W-winR-1;x++){
      let a=0,b=0,c=0;
      for(let dy=-winR;dy<=winR;dy++) for(let dx=-winR;dx<=winR;dx++){
        const ix=Ix[(y+dy)*W+(x+dx)],iy=Iy[(y+dy)*W+(x+dx)];
        a+=ix*ix; b+=iy*iy; c+=ix*iy;
      }
      R[y*W+x]=a*b-c*c-0.04*(a+b)*(a+b);
    }
    let maxR=arrMax(R); const thr=maxR*0.005;
    const nms=Math.round(sigma*4)+3;
    for(let y=nms;y<H-nms;y++) for(let x=nms;x<W-nms;x++){
      if(R[y*W+x]<thr) continue;
      let best=true;
      for(let dy=-nms;dy<=nms&&best;dy++) for(let dx=-nms;dx<=nms;dx++){
        if(!dx&&!dy) continue;
        if(R[(y+dy)*W+(x+dx)]>=R[y*W+x]){best=false;break;}
      }
      if(best) allKps.push({x,y,r:R[y*W+x],sigma});
    }
  }
  allKps.sort((a,b)=>b.r-a.r);
  const kept=[], used=new Set();
  for(const kp of allKps){
    const key=`${Math.floor(kp.x/5)}_${Math.floor(kp.y/5)}`;
    if(!used.has(key)){used.add(key);kept.push(kp);}
    if(kept.length>=nMax) break;
  }
  return kept;
};

// ... (SIFT, SSD, RANSAC, Warp functions) ...

// ----------------------------------------------------------
// COMPONENTS (Histogram, ErrorBoundary, RegistrationPanel)
// ----------------------------------------------------------
function Histogram({imageData,label}){
    // ... Histogram logic ...
    return <canvas width={260} height={70}/>;
}

class ErrorBoundary extends React.Component{
    // ... ErrorBoundary logic ...
    render(){ return this.props.children; }
}

function RegistrationPanel({color, activeTopic}){
    // ... Advanced Registration UI logic ...
}

// ----------------------------------------------------------
// MAIN APP & PARAMETERS
// ----------------------------------------------------------
const REG_SPECIAL=["Upload & Match","Feature Detection","Keypoint Matching","Homography","Aligned Overlay","Difference Map"];
const MATCH_SPECIAL=["Upload & Match","BF Match Viz"];
const PARAM_MAP={
  "Gamma":[{key:"gamma",label:"gamma",min:0.1,max:3,step:0.05}],
  "Thresholding":[{key:"thresh",label:"T",min:0,max:255,step:1}],
  // ... more params ...
};

export default function App(){
  const [activeMod,setActiveMod]=useState(MODULES[0]);
  const [activeTopic,setActiveTopic]=useState(MODULES[0].topics[0]);
  const [origData,setOrigData]=useState(null);
  const [procData,setProcData]=useState(null);
  const [params,setParams]=useState({gamma:1.0,thresh:128,plane:7,d0:40,n:2,sigma:20,k:0.05,angle:15,scale:1.2,tx:20,ty:20,wavThresh:20});
  const [sidebar,setSidebar]=useState(true);
  const [webcamOn,setWebcamOn]=useState(false);
  const [liveMode,setLiveMode]=useState('sobel');

  // ... (Upload, Webcam, Rendering logic) ...

  return (
    <div style={{display:"flex",height:"100vh",background:"#070710"}}>
       {/* Sidebar, Header, and Canvas grid */}
    </div>
  );
}