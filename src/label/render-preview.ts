import type { OverlayArea } from '../types';

export function splitBigText(text: string): string[] {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 8);
}

export function renderPreview(source: HTMLCanvasElement, text: string, area: OverlayArea): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0);
  context.fillStyle = '#fff';
  context.fillRect(area.x, area.y, area.width, area.height);
  context.strokeStyle = '#000';
  context.lineWidth = 3;
  context.strokeRect(area.x + 1.5, area.y + 1.5, area.width - 3, area.height - 3);

  const lines = splitBigText(text);
  const maxFont = Math.floor(area.height / Math.max(1, lines.length) * 0.72);
  let fontSize = Math.min(92, maxFont);
  context.font = `900 ${fontSize}px Arial, sans-serif`;
  const longest = lines.reduce((best, line) => context.measureText(line).width > context.measureText(best).width ? line : best, '');
  while (fontSize > 24 && context.measureText(longest).width > area.width - 22) {
    fontSize -= 2;
    context.font = `900 ${fontSize}px Arial, sans-serif`;
  }
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#000';
  const lineHeight = fontSize * 1.08;
  const startY = area.y + area.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, area.x + area.width / 2, startY + index * lineHeight, area.width - 18));
  return canvas;
}
