import { CanvasTexture, SRGBColorSpace } from 'three';

const LABEL_SIZE = 64;
const LABEL_BACKGROUND = '#142044';
const LABEL_FOREGROUND = '#ffffff';

function createLabelTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_SIZE;
  canvas.height = LABEL_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Label canvas unavailable.');
  const center = LABEL_SIZE / 2;
  context.fillStyle = LABEL_BACKGROUND;
  context.beginPath();
  context.arc(center, center, center - 3, 0, 2 * Math.PI);
  context.fill();
  context.fillStyle = LABEL_FOREGROUND;
  context.font = 'bold 38px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, center, center + 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createBodyLabels(count: number): CanvasTexture[] {
  return Array.from({ length: count }, (_, body) => createLabelTexture(String(body + 1)));
}
