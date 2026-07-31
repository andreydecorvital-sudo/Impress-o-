import type { OverlayArea, ProtectedArea } from '../types';

function intersects(a: OverlayArea, b: ProtectedArea): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function validateOverlay(
  area: OverlayArea,
  protectedAreas: ProtectedArea[],
  pageWidth: number,
  pageHeight: number,
): string[] {
  const errors: string[] = [];
  if (area.x < 0 || area.y < 0 || area.width <= 0 || area.height <= 0
    || area.x + area.width > pageWidth || area.y + area.height > pageHeight) {
    errors.push('A área do texto está fora dos limites da etiqueta.');
  }
  const collisions = protectedAreas.filter((protectedArea) => intersects(area, protectedArea));
  if (collisions.length) {
    errors.push(`A área do texto cobre informação obrigatória: ${collisions.map((item) => item.name).join(', ')}.`);
  }
  return errors;
}
