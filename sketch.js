// =============================================================
// 实例1：固定底层画布（face.png 常驻 + 4张图切换）
// =============================================================
new p5(function(p) {
  let faceImg;
  let portraits = []; // portrait_1 ~ portrait_4
  let currentIndex = -1; // -1=首屏只显示face.png
  let currentImg;
  let displayWidth, displayHeight, scaleFactor;

  // 背景人脸位置参数
  let faceOffsetX = 0;
  let faceOffsetY = 0;

  p.preload = function() {
    faceImg = p.loadImage(window.ORIGINAL_ASSETS.face);
    portraits = [
      p.loadImage(window.ORIGINAL_ASSETS.portrait1),
      p.loadImage(window.ORIGINAL_ASSETS.portrait2),
      p.loadImage(window.ORIGINAL_ASSETS.portrait3),
      p.loadImage(window.ORIGINAL_ASSETS.portrait4)
    ];
  };

  p.setup = function() {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("canvas-container");
    p.pixelDensity(1);
    p.imageMode(p.CENTER);
    p.noStroke();
    
    window.addEventListener('scroll', updateImageByScroll);
    updateImageByScroll();
  };

  // 滚动切换图片
  function updateImageByScroll() {
    let scrollY = window.scrollY || window.pageYOffset;
    let archive = document.getElementById('photo-archive');
    if (archive && archive.getBoundingClientRect().top <= window.innerHeight) {
      currentIndex = -1;
      currentImg = null;
      return;
    }
    let viewportH = window.innerHeight;
    let sectionIndex = p.floor(scrollY / viewportH);
    // 第0屏（首屏）：只显示face.png；第1-4屏：对应4张图
    let targetIndex = sectionIndex - 1;
    targetIndex = p.constrain(targetIndex, -1, portraits.length - 1);
    
    if (targetIndex !== currentIndex) {
      currentIndex = targetIndex;
      currentImg = currentIndex >= 0 ? portraits[currentIndex] : null;
    }
  }

  p.draw = function() {
    p.clear();

    // ===== 1. 最底层：常驻 face.png 效果（永远显示） =====
    if (faceImg) {
      p.push();
      p.translate(p.width / 2 + faceOffsetX, p.height / 2 + faceOffsetY);
      
      let faceRatio = faceImg.width / faceImg.height;
      let faceW, faceH;
      if (p.width / p.height > faceRatio) {
        faceW = p.width;
        faceH = p.width / faceRatio;
      } else {
        faceH = p.height;
        faceW = p.height * faceRatio;
      }

      // 原有左偏抖动效果
      let time = p.millis() * 0.003;
      let offsetX = -p.abs(p.sin(time)) * 40; 
      if (p.random() > 0.9) {
          offsetX -= p.random(5, 20);
      }

      p.tint(255, 120); 
      p.image(faceImg, offsetX, 0, faceW, faceH);
      p.noTint();
      p.pop();
    }

    // ===== 2. 上层：对应区块的人物图 + 差异化故障效果 =====
    if (currentImg) {
      calculateSize();
      p.push();
      p.translate(p.width / 2, p.height / 2);

      switch(currentIndex) {
        case 0: drawPixelFracture(); break; // 像素碎裂
        case 1: drawNoiseErode(); break;   // 噪点侵蚀
        case 2: drawScanlineShift(); break; // 行错位扫描
        case 3: drawDataBend(); break;    // 数据弯曲
      }
      
      p.pop();
    }
  };

  function calculateSize() {
    let maxWidth = p.width * 0.72;
    let maxHeight = p.height * 0.82;
    let ratio = currentImg.width / currentImg.height;
    displayWidth = maxWidth;
    displayHeight = displayWidth / ratio;
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * ratio;
    }
    scaleFactor = displayWidth / currentImg.width;
  }

  // 故障风格1：像素碎裂
  function drawPixelFracture() {
    let pixelSize = 8;
    let time = p.millis() * 0.002;
    
    p.tint(255, 200);
    p.image(currentImg, 0, 0, displayWidth, displayHeight);

    p.loadPixels();
    for (let y = 0; y < displayHeight; y += pixelSize) {
      let shift = p.floor(p.noise(y * 0.01, time) * 20 - 10);
      if (p.random() > 0.85) shift += p.random(-30, 30);
      
      for (let x = 0; x < displayWidth; x += pixelSize) {
        let srcX = p.constrain(x + shift, 0, displayWidth - 1);
        let srcY = p.constrain(y, 0, displayHeight - 1);
        let idx = p.floor(srcY) * p.width + p.floor(srcX);
        let c = p.pixels[idx * 4];
        p.fill(c, p.pixels[idx*4+1], p.pixels[idx*4+2], 220);
        p.rect(x - displayWidth/2, y - displayHeight/2, pixelSize, pixelSize);
      }
    }
  }

  // 故障风格2：噪点侵蚀
  function drawNoiseErode() {
    let time = p.millis() * 0.001;
    
    p.tint(255, 180);
    p.image(currentImg, 0, 0, displayWidth, displayHeight);

    for (let i = 0; i < 800; i++) {
      let x = p.random(-displayWidth/2, displayWidth/2);
      let y = p.random(-displayHeight/2, displayHeight/2);
      let dist = p.dist(x, y, 0, 0);
      let alpha = p.map(dist, 0, displayWidth/2, 255, 0);
      
      if (p.random() > 0.5) {
        p.fill(255, alpha * 0.6);
      } else {
        p.fill(0, alpha * 0.8);
      }
      p.rect(x, y, p.random(2, 8), p.random(2, 8));
    }

    for (let i = 0; i < 30; i++) {
      if (p.noise(i, time) > 0.7) {
        let x = p.random(-displayWidth/2, displayWidth/2);
        let y = p.random(-displayHeight/2, displayHeight/2);
        p.fill(10, 200);
        p.rect(x, y, p.random(20, 80), p.random(4, 20));
      }
    }
  }

  // 故障风格3：行错位扫描
  function drawScanlineShift() {
    let sliceH = 12;
    let maxShift = 40;
    let time = p.millis() * 0.0015;
    let numSlices = p.floor(displayHeight / sliceH);

    for (let i = 0; i < numSlices; i++) {
      let y = -displayHeight / 2 + i * sliceH;
      let shift = p.sin(time + i * 0.3) * maxShift * p.noise(i * 0.1, time);
      
      if (p.noise(i * 0.2, time * 0.5) > 0.78) {
        shift += p.random(-maxShift * 2, maxShift * 2);
      }

      let sourceY = p.map(y, -displayHeight / 2, displayHeight / 2, 0, currentImg.height);
      let sourceH = sliceH / scaleFactor;

      if (i % 5 === 0) {
        p.blendMode(p.ADD);
        p.tint(255, 255, 0, 60);
        p.image(currentImg, shift + 4, y, displayWidth, sliceH, 0, sourceY, currentImg.width, sourceH);
        p.tint(0, 255, 255, 60);
        p.image(currentImg, shift - 4, y, displayWidth, sliceH, 0, sourceY, currentImg.width, sourceH);
        p.blendMode(p.BLEND);
      }

      p.tint(255, 220);
      p.image(currentImg, shift, y, displayWidth, sliceH, 0, sourceY, currentImg.width, sourceH);
    }
  }

  // 故障风格4：数据弯曲
  function drawDataBend() {
    let time = p.millis() * 0.002;
    
    p.tint(255, 190);
    p.image(currentImg, 0, 0, displayWidth, displayHeight);

    p.loadPixels();
    for (let y = 0; y < displayHeight; y++) {
      let wave = p.sin(y * 0.02 + time) * 15;
      let bend = p.noise(y * 0.01, time * 0.5) * 20;
      let shift = p.floor(wave + bend);
      
      for (let x = 0; x < displayWidth; x++) {
        let srcX = p.constrain(x + shift, 0, displayWidth - 1);
        let dstIdx = (y * p.width + x) * 4;
        let srcIdx = (y * p.width + p.floor(srcX)) * 4;
        
        p.pixels[dstIdx] = p.pixels[srcIdx];
        p.pixels[dstIdx+1] = p.pixels[srcIdx+1];
        p.pixels[dstIdx+2] = p.pixels[srcIdx+2];
      }
    }
    p.updatePixels();

    for (let i = 0; i < 20; i++) {
      let x = p.map(p.noise(i * 0.5, time * 0.3), 0, 1, -displayWidth/2, displayWidth/2);
      let y = p.map(p.noise(i * 0.3 + 10, time * 0.2), 0, 1, -displayHeight/2, displayHeight/2);
      let w = p.random(30, 100);
      let h = p.random(10, 40);
      
      p.tint(255, 150);
      p.image(currentImg, x, y, w, h, 
        p.map(x, -displayWidth/2, displayWidth/2, 0, currentImg.width),
        p.map(y, -displayHeight/2, displayHeight/2, 0, currentImg.height),
        w / scaleFactor, h / scaleFactor
      );
    }
  }

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    updateImageByScroll();
  };
});


// =============================================================
// 实例2：首屏滚动画布（portrait.jpg 原版故障，和文字一起滚动）
// =============================================================
new p5(function(p) {
  let img;
  let blockSize = 22;
  let numBlocks = 95;
  let sliceHeight = 18;
  let sliceShift = 28;
  let glitchBlocks = [];
  let displayWidth;
  let displayHeight;
  let scaleFactor;

  p.preload = function() {
    img = p.loadImage(window.ORIGINAL_ASSETS.portrait);
  };

  p.setup = function() {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("hero-canvas");
    p.pixelDensity(1);
    p.imageMode(p.CENTER);
    p.noStroke();
    createGlitchBlocks();
  };

  p.draw = function() {
    p.clear();
    if (!img) return;
    
    calculateSize();
    p.push();
    p.translate(p.width / 2, p.height / 2);
    
    drawOriginal();
    drawRGBGlitch();
    drawGlitchSlices();
    drawMovingBlocks();
    
    p.pop();
  };

  function calculateSize() {
    let maxWidth = p.width * 0.72;
    let maxHeight = p.height * 0.82;
    let ratio = img.width / img.height;
    displayWidth = maxWidth;
    displayHeight = displayWidth / ratio;
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * ratio;
    }
    scaleFactor = displayWidth / img.width;
  }

  function drawOriginal() {
    p.image(img, 0, 0, displayWidth, displayHeight);
  }

  function drawRGBGlitch() {
    let time = p.millis() * 0.0005;
    let rgbMovement = p.sin(time * 2.0) * 8;
    p.blendMode(p.ADD);
    p.tint(255, 0, 0, 45);
    p.image(img, rgbMovement, 0, displayWidth, displayHeight);
    p.tint(0, 80, 255, 45);
    p.image(img, -rgbMovement, 0, displayWidth, displayHeight);
    p.tint(255);
    p.blendMode(p.BLEND);
  }

  function drawGlitchSlices() {
    let time = p.millis() * 0.001;
    let numberOfSlices = p.floor(displayHeight / sliceHeight);
    for (let i = 0; i < numberOfSlices; i++) {
      let y = -displayHeight / 2 + i * sliceHeight;
      let wave = p.sin(time * 0.8 + i * 0.5);
      let shift = wave * sliceShift;
      let randomGlitch = p.noise(i * 0.15, time * 0.3);
      if (randomGlitch > 0.72) {
        shift += p.map(randomGlitch, 0.72, 1, -sliceShift, sliceShift);
      }
      let sourceY = p.map(y, -displayHeight / 2, displayHeight / 2, 0, img.height);
      let sourceH = sliceHeight / scaleFactor;
      p.push();
      p.tint(255, 230);
      p.image(img, shift, y, displayWidth, sliceHeight, 0, sourceY, img.width, sourceH);
      p.pop();
    }
  }

  function createGlitchBlocks() {
    glitchBlocks = [];
    for (let i = 0; i < numBlocks; i++) {
      glitchBlocks.push({
        x: p.random(),
        y: p.random(),
        speedX: p.random(-0.005, 0.005),
        speedY: p.random(-0.003, 0.003),
        size: p.random(10, 40),
        alpha: p.random(90, 180),
        phase: p.random(p.TWO_PI),
      });
    }
  }

  function drawMovingBlocks() {
    let time = p.millis() * 0.0003;
    for (let block of glitchBlocks) {
      block.x += block.speedX;
      block.y += block.speedY;
      if (block.x > 1.1) block.x = -0.1;
      if (block.x < -0.1) block.x = 1.1;
      if (block.y > 1.1) block.y = -0.1;
      if (block.y < -0.1) block.y = 1.1;
      let x = p.map(block.x, 0, 1, -displayWidth / 2, displayWidth / 2);
      let y = p.map(block.y, 0, 1, -displayHeight / 2, displayHeight / 2);
      let animatedSize = block.size + p.sin(time * 0.1 + block.phase) * 5;
      let sourceX = p.constrain(p.floor(block.x * img.width), 0, img.width - 1);
      let sourceY = p.constrain(p.floor(block.y * img.height), 0, img.height - 1);
      let c = img.get(sourceX, sourceY);
      p.fill(p.red(c), p.green(c), p.blue(c), block.alpha);
      p.rect(x, y, animatedSize, animatedSize);
    }
  }

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
});



