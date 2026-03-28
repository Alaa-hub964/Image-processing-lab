---
title: 'DIPT-Web: A Browser-Based Interactive Digital Image Processing Toolkit Implementing 17 Educational Modules in Pure JavaScript'
tags:
  - JavaScript
  - image processing
  - education
  - HTML5 Canvas
  - WebRTC
  - real-time
  - computer vision
  - mobile web
authors:
  - name: Alaa Alowaidi
    orcid: 0009-0003-8833-2471
    affiliation: 1
    corresponding: true
  - name: Pushpendra Kumar Pateriya
    affiliation: 1
affiliations:
  - name: School of Computing & Artificial Intelligence, Lovely Professional University, Phagwara, Punjab, India
    index: 
    ror: 00et6q107
date: 27 March 2026
bibliography: paper.bib
---

# Summary

DIPT-Web" is a completely free, interactive, and online tool for studying and investigating digital image processing. "DIPT-Web" is a completely client-side JavaScript implementation of 17 processing modules and 187 operations without relying on any image processing library. "DIPT-Web" supports a one-semester course on digital image processing, including all of the standard topics in intensity transformation, histogram processing, spatial filtering, frequency filtering, image restoration, geometric transforms, color image processing, medical imaging, wavelet decomposition, image compression, segmentation, morphological image processing, feature detection, Gabor texture analysis, and optical flow estimation.It also has a real-time Sobel edge detection mode using the WebRTC `getUserMedia()` API [@w3c_webrtc] to process live webcam video at a rate of 30 FPS directly in the browser. The platform is available as a zero-install web app at <https://image-processing-lab-pied.vercel.app>, with the source code available on GitHub at <https://github.com/Alaa-hub964/Image-processing-lab> under the MIT license [@ipt_web_github] and archived on Zenodo [@zenodo2026]. DIPT-Web is also fully mobile-responsive with a specific bottom navigation interface validated on Android 13 and iOS 16, making it available on smartphones with no changes.

# Statement of Need

Digital image processing is a fundamental course in computer science and electrical engineering curricula all over the world. Programming assignments in image processing labs usually demand the use of MATLAB [@gonzalez2018] or Python with OpenCV library [@bradski2008], both of which involve considerable hurdles in terms of software installation and configuration. Students need to deal with issues related to software licenses, package managers, interpreters, and dependency conflicts before they even begin to write a single line of code for image processing. For resource-constrained environments, including old laptops, shared computers, or environments where internet connectivity is limited, these hurdles may act as a barrier for students to attempt homework outside of lab hours.

The installation problem is completely avoided with browser-based solutions. Nevertheless, existing browser-based image processing solutions either only allow limited image processing techniques such as artistic filters, rely on server-side Python computation, or utilize compiled C++ code via WebAssembly (like OpenCV.js that is over 8 MB in size and where implementation details are hidden within a compiled binary). No existing browser-based solution offers the complete canonical DIP curriculum implemented in transparent and readable client-side JavaScript code without server-side computation. DIPT-Web fills this existing gap. Every algorithm, ranging from histogram equalization and CLAHE [@zuiderveld1994] to Harris corner detection [@harris1988], Otsu thresholding [@otsu1979], Gabor filters [@daugman1985], and ...Lucas-Kanade optical flow [@lucas1981], Horn-Schunck optical flow [@horn1981], Canny edge detection [@canny1986], Mallat wavelet decomposition [@mallat1989], and Gabor texture analysis [@jain1991; @daugman1985] is implemented using only 10 to 30 lines of readable JavaScript code. This makes the code itself a learning resource that can be read, modified, and learned from by students.

# State of the Field

The main alternatives to DIPT-Web for DIP education are:

'MATLAB Image Processing Toolbox' : powerful and widely used, but a commercial licence is required. Algorithm implementations are not visible to students.

'Python with scikit-image / OpenCV' [@van2014; @bradski2008] : free and open source, but needs to be installed locally in a Python environment. Installation can be tricky in an introductory course. The algorithms are implemented in C, which students without extensive knowledge of the library won't be able to read.

'OpenCV.js' : a WebAssembly-based implementation of OpenCV that runs in the browser. Its bundle is larger than 8 MB, takes a long time to load over modest internet connections, and has compiled binary implementations of algorithms that students can't inspect or read.

'Marvin' [@bigolin2010] : A Java-based open-source image processing framework with a browser component. Limited to basic operations, last updated over a decade ago, and requires Java.

DIPT-Web differs from the above in two specific ways: (1) every algorithm is implemented in plain readable JavaScript that students can view by using the developer tools in the browser, without the need for a library; and (2) the tool requires absolutely no setup or registration – it simply opens in the browser immediately. The live webcam Sobel mode is not available in any of the above alternatives without significant setup.

# Software Design

Several deliberate design decisions have shaped the DIPT-Web architecture.

'No external image processing library' : The HTML5 `ImageData` interface has a `Uint8ClampedArray` pixel buffer in row-major order in RGBA format. This is all that is required to implement any pixel-level operation. By avoiding libraries, we keep our bundle small (~180 KB gzipped), ensure all algorithms are transparent and inspectable, and ensure that our platform will always continue working so long as the Canvas API is supported, which is guaranteed by the W3C specification [@w3c_canvas].

'Single pure processing function' : All 187 operations are passed through a single function, `processImg(src, modId, topic, params)`, which accepts an `ImageData` and returns a new `ImageData` without modifying the original. This makes the flow of the data easy to follow and extend.

'Float32Array for intermediate results' : Canvas pixel values are stored in `Uint8ClampedArray` format. This is an integer between 0 and 255. Convolution results can be negative (for edge detection) and can also exceed 255 (for sharpening). Intermediate results are stored in `Float32Array` format so that they are not clamped prematurely.

'Loop-based array extrema' : The use of the JavaScript syntax `Math.min(...array)` via the "spread syntax" will lead to a stack overflow for arrays longer than 65,000 elements. In the case of a 320x320 pixel image, which has 102,400 pixels, this is a significant problem. All array minimums and maximums use the "for" loop syntax.

'requestAnimationFrame render loop for live webcam' : The live Sobel pipeline uses the following steps: it draws the decoded video frame onto an offscreen canvas using the `drawImage()` call, gets the pixel buffer using the `getImageData()` call, computes the gradient magnitude using inline 3x3 Sobel filters, and writes the result onto a visible canvas using the `putImageData()` call. The use of `requestAnimationFrame()` ensures synchronization with the display refresh cycle, which helps prevent frames from being dropped.

'Declarative module system' :  Each of the 17 modules is defined as a plain JavaScript object, with a unique ID, a display label, a color accent, a list of operation topics, and a dictionary of theory where each topic is mapped to a mathematical description. This completely separates content from rendering. Adding a new module is simply a matter of adding a new object to the `MODULES` array.

'Mobile-responsive layout' :  For screens less than 768px, the desktop sidebar and parameter panel are replaced by a four-tab bottom navigation bar (Modules / Operations / Canvas / Theory) that uses only CSS media queries without the need for a JavaScript framework. Touch targets for operation chips and slider thumb elements are also made large enough for comfortable thumb interaction. This design was also validated on Android 13 (Chrome Mobile) and iOS 16 (Safari Mobile) to ensure that all 187 operations are accessible on a smartphone without the need for desktop interaction.

# Research Impact Statement

The DIPT-Web covers all topics in the 17 chapters of the book by Gonzalez and Woods [@gonzalez2018], which is the most widely used DIP textbook. Hence, DIPT-Web can be directly used as a laboratory companion to any DIP course based on any textbook. The DIPT-Web has been tested to work with Windows 10/11, macOS 13, Ubuntu 22.04, Android 13, and iOS 16 operating systems without any configuration. This implies that students can access the DIPT-Web on any computer in the university or even during lectures on a smartphone, thus increasing its accessibility. The live Sobel webcam mode also gives users a unique capability not available in any other environment like MATLAB or Python notebook environments, where they can run a demonstration of the algorithms in real-time without any extra hardware configuration. The open-source nature of the DIPT-Web, with its zero dependency policy, also implies that any developer can directly reuse the code in any other project where they need to implement browser-based versions of algorithms like CLAHE, Harris corner detection, or Lucas-Kanade optical flow.

'Limitations and future work' : Currently, the implementation carries out all the computations on the CPU utilizing JavaScript typed arrays. Heavier computations like CLAHE and Gabor filter banks take a while to compute for larger images. For future work, we plan to explore the following areas: (1) speeding up heavy computations by utilizing the GPU through WebGL fragment shaders, (2) inclusion of deep learning inference modules utilizing TensorFlow.js to connect classical and contemporary image processing, and (3) conducting a controlled user study to compare the learning outcomes of students utilizing DIPT-Web with those utilizing a MATLAB-based laboratory environment.

# AI Usage Disclosure

Claude (Anthropic, claude-sonnet-4.6) was used to assist with parts of the JavaScript source code generation, code debugging. The authors reviewed, tested, and validated all AI-assisted code. Authors were responsible for architectural decisions such as module structure, Canvas API pipeline, no library usage, and live webcam implementation. Authors take full responsibility for the accuracy, originality, and content of all submitted materials.

# Acknowledgements

The authors thank Lovely Professional University for providing the academic environment that supported this work. The Vercel platform is acknowledged for providing free hosting for the deployed application.

# References
