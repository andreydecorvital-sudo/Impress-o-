function rotateClockwise(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.height;
  canvas.height = source.width;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');
  context.translate(canvas.width, 0);
  context.rotate(Math.PI / 2);
  context.drawImage(source, 0, 0);
  return canvas;
}

function crop(source: HTMLCanvasElement, x: number, y: number, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function cropDeclarationHeader(source: HTMLCanvasElement): HTMLCanvasElement {
  const rotated = source.height > source.width ? rotateClockwise(source) : source;
  return crop(rotated, 0, 0, rotated.width, rotated.height * 0.27);
}

export function cropDeclarationTable(source: HTMLCanvasElement): HTMLCanvasElement {
  const rotated = source.height > source.width ? rotateClockwise(source) : source;
  return crop(rotated, rotated.width * 0.02, rotated.height * 0.265, rotated.width * 0.96, rotated.height * 0.28);
}
