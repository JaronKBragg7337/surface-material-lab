import * as THREE from 'three';

function canvasTexture(canvas, colorSpace = THREE.NoColorSpace) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export async function createDerivedMaps(url) {
  const image = await loadImage(url);
  const size = 512;
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = size;
  sourceCanvas.height = size;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, size, size);
  const sourceData = sourceContext.getImageData(0, 0, size, size).data;

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const heightContext = heightCanvas.getContext('2d');
  const heightImage = heightContext.createImageData(size, size);

  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = size;
  roughnessCanvas.height = size;
  const roughnessContext = roughnessCanvas.getContext('2d');
  const roughnessImage = roughnessContext.createImageData(size, size);

  const luminance = new Float32Array(size * size);
  for (let index = 0; index < size * size; index += 1) {
    const pixel = index * 4;
    const value = (sourceData[pixel] * 0.2126 + sourceData[pixel + 1] * 0.7152 + sourceData[pixel + 2] * 0.0722) / 255;
    luminance[index] = value;
    const heightValue = Math.round(THREE.MathUtils.clamp((value - 0.22) * 1.45, 0, 1) * 255);
    const roughnessValue = Math.round(THREE.MathUtils.clamp(0.72 + (1 - value) * 0.25, 0, 1) * 255);
    heightImage.data[pixel] = heightValue;
    heightImage.data[pixel + 1] = heightValue;
    heightImage.data[pixel + 2] = heightValue;
    heightImage.data[pixel + 3] = 255;
    roughnessImage.data[pixel] = roughnessValue;
    roughnessImage.data[pixel + 1] = roughnessValue;
    roughnessImage.data[pixel + 2] = roughnessValue;
    roughnessImage.data[pixel + 3] = 255;
  }
  heightContext.putImageData(heightImage, 0, 0);
  roughnessContext.putImageData(roughnessImage, 0, 0);

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalContext = normalCanvas.getContext('2d');
  const normalImage = normalContext.createImageData(size, size);
  const sample = (x, y) => luminance[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (sample(x - 1, y) - sample(x + 1, y)) * 2.4;
      const dy = (sample(x, y - 1) - sample(x, y + 1)) * 2.4;
      const normal = new THREE.Vector3(dx, dy, 1).normalize();
      const pixel = (y * size + x) * 4;
      normalImage.data[pixel] = Math.round((normal.x * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 2] = Math.round(normal.z * 255);
      normalImage.data[pixel + 3] = 255;
    }
  }
  normalContext.putImageData(normalImage, 0, 0);

  const checkerCanvas = document.createElement('canvas');
  checkerCanvas.width = 512;
  checkerCanvas.height = 512;
  const checkerContext = checkerCanvas.getContext('2d');
  const cells = 16;
  const cellSize = checkerCanvas.width / cells;
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      checkerContext.fillStyle = (x + y) % 2 ? '#d5e1dd' : '#263b47';
      checkerContext.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  const checkerTexture = canvasTexture(checkerCanvas, THREE.SRGBColorSpace);
  checkerTexture.wrapS = THREE.RepeatWrapping;
  checkerTexture.wrapT = THREE.RepeatWrapping;

  return {
    height: canvasTexture(heightCanvas),
    normal: canvasTexture(normalCanvas),
    roughness: canvasTexture(roughnessCanvas),
    checker: checkerTexture,
  };
}

export function createMacroTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const image = context.createImageData(128, 128);
  let seed = 9137;
  for (let index = 0; index < image.data.length; index += 4) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const value = 95 + Math.floor((seed / 4294967296) * 130);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = canvasTexture(canvas);
  texture.repeat.set(1.4, 1.1);
  return texture;
}
