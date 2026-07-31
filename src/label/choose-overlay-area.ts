import type { OverlayArea } from '../types';

export function clampOverlay(area: OverlayArea, width: number, height: number): OverlayArea {
  const x = Math.max(0, Math.min(Math.round(area.x), width - 1));
  const y = Math.max(0, Math.min(Math.round(area.y), height - 1));
  return {
    ...area,
    x,
    y,
    width: Math.max(40, Math.min(Math.round(area.width), width - x)),
    height: Math.max(40, Math.min(Math.round(area.height), height - y)),
    requiresSelection: false,
  };
}

export function bindOverlaySelector(canvas: HTMLCanvasElement, onSelect: (area: OverlayArea) => void): () => void {
  let start: { x: number; y: number } | null = null;
  const point = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) * (canvas.width / rect.width)),
      y: Math.round((event.clientY - rect.top) * (canvas.height / rect.height)),
    };
  };
  const down = (event: PointerEvent) => {
    start = point(event);
    canvas.setPointerCapture(event.pointerId);
  };
  const up = (event: PointerEvent) => {
    if (!start) return;
    const end = point(event);
    const area = clampOverlay({
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(start.x - end.x),
      height: Math.abs(start.y - end.y),
      template: 'Área selecionada manualmente',
    }, canvas.width, canvas.height);
    start = null;
    onSelect(area);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointerup', up);
  };
}
