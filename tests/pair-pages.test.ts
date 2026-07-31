import { describe, expect, it } from 'vitest';
import { pairPages } from '../src/pages/pair-pages';
import type { PageAnalysis, PageKind } from '../src/types';

function page(index: number, kind: PageKind, orderKeys: string[]): PageAnalysis {
  return {
    page: {
      index,
      graphic: { name: `R:P${index}.GRF`, totalBytes: 1, bytesPerRow: 1, width: 8, height: 1, z64: '', originalCommand: '' },
      printBlock: '^XA^XZ',
      source: '',
    },
    canvas: {} as HTMLCanvasElement,
    text: orderKeys.join(' '),
    confidence: 90,
    kind,
    orderKeys,
    trackingKeys: [],
  };
}

describe('pareamento de páginas', () => {
  it('prioriza o mesmo pedido, mesmo fora de ordem', () => {
    const analyses = [
      page(0, 'shipping', ['PEDIDO-A']),
      page(1, 'checklist', ['PEDIDO-B']),
      page(2, 'shipping', ['PEDIDO-B']),
      page(3, 'checklist', ['PEDIDO-A']),
    ];
    const result = pairPages(analyses);
    expect(result[0].detail?.page.index).toBe(3);
    expect(result[1].detail?.page.index).toBe(1);
    expect(result.every((pair) => pair.confidence === 100)).toBe(true);
  });

  it('marca proximidade como pareamento que exige confirmação', () => {
    const result = pairPages([page(0, 'shipping', []), page(1, 'checklist', [])]);
    expect(result[0].requiresConfirmation).toBe(true);
  });
});
