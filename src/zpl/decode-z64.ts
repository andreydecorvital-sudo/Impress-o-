import { inflate } from 'pako';
import type { ZplGraphic } from '../types';

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function decodeZ64(graphic: ZplGraphic): Uint8Array {
  const inflated = inflate(decodeBase64(graphic.z64));
  if (inflated.length === graphic.totalBytes) return inflated;
  const asText = new TextDecoder().decode(inflated).replace(/\s/g, '');
  if (/^[0-9a-f]+$/i.test(asText) && asText.length >= graphic.totalBytes * 2) {
    const bytes = new Uint8Array(graphic.totalBytes);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(asText.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  }
  if (inflated.length < graphic.totalBytes) throw new Error(`O gráfico ${graphic.name} está incompleto.`);
  return inflated.slice(0, graphic.totalBytes);
}

export function graphicToCanvas(graphic: ZplGraphic): HTMLCanvasElement {
  const bytes = decodeZ64(graphic);
  const canvas = document.createElement('canvas');
  canvas.width = graphic.width;
  canvas.height = graphic.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('O navegador não disponibilizou o Canvas 2D.');
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let byteX = 0; byteX < graphic.bytesPerRow; byteX += 1) {
      const value = bytes[y * graphic.bytesPerRow + byteX] ?? 0;
      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteX * 8 + bit;
        const offset = (y * canvas.width + x) * 4;
        const color = value & (128 >> bit) ? 0 : 255;
        image.data[offset] = color;
        image.data[offset + 1] = color;
        image.data[offset + 2] = color;
        image.data[offset + 3] = 255;
      }
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
