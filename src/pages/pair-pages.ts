import type { PageAnalysis, PairResult } from '../types';

function intersects(left: string[], right: string[]): boolean {
  return left.some((key) => right.includes(key));
}

export function pairPages(analyses: PageAnalysis[]): PairResult[] {
  const shipping = analyses.filter((page) => page.kind === 'shipping');
  const details = analyses.filter((page) => page.kind === 'checklist' || page.kind === 'declaration');
  const used = new Set<number>();

  return shipping.map((ship) => {
    let best: { detail: PageAnalysis; score: number; reason: string } | null = null;
    for (const detail of details) {
      if (used.has(detail.page.index)) continue;
      const distance = Math.abs(detail.page.index - ship.page.index);
      let score = 0;
      let reason = 'proximidade entre páginas';
      if (intersects(ship.orderKeys, detail.orderKeys)) {
        score = 100;
        reason = 'mesmo número de pedido';
      } else if (intersects(ship.trackingKeys, detail.trackingKeys)) {
        score = 90;
        reason = 'mesmo código de rastreio';
      } else {
        const common = ship.orderKeys.filter((key) => detail.text.toUpperCase().includes(key));
        if (common.length) {
          score = 75;
          reason = 'identificador comum';
        } else {
          score = Math.max(0, 35 - distance * 8 + (detail.page.index > ship.page.index ? 5 : 0));
        }
      }
      if (!best || score > best.score) best = { detail, score, reason };
    }
    if (!best) return { shipping: ship, detail: null, confidence: 0, reason: 'sem página de itens', requiresConfirmation: true };
    used.add(best.detail.page.index);
    return {
      shipping: ship,
      detail: best.detail,
      confidence: best.score,
      reason: best.reason,
      requiresConfirmation: best.score < 70,
    };
  });
}
