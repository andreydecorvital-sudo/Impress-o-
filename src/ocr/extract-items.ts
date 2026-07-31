import type { ItemData } from '../types';
import { calculateTotal, unitsPerPackage } from '../products/calculate-quantity';
import { normalizeProduct } from '../products/normalize-product';

const blocked = /DESTINAT|ENDERE[CÃ‡]O|CEP|RASTREIO|TRACKING|CHECKLIST|ATEN[CÃ‡][AÃƒ]O|PEDIDO|VARIA[CÃ‡][AÃƒ]O|PRODUTO|SELLER|VALOR|TOTAL/i;
const knownProduct = /CAPIM|BUCHINH|PLACA|P[EÃ‰]TALA|PARAFUS|BUCHA|COLA|JARDIM|PAMPAS/i;

function clean(value: string): string {
  return value.replace(/[|_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function quantityNear(line: string): number {
  const explicit = line.match(/(?:QTD|QNT|QTDE|QUANTIDADE)\s*[:#-]?\s*(\d+)/i);
  if (explicit) return Number(explicit[1]);
  const beforeSku = [...line.matchAll(/(?:\||\s)(\d{1,3})(?=\s*(?:\||I?(?:CAPIM|BUCHINHO)|K\.))/gi)];
  if (beforeSku.length) return Number(beforeSku[beforeSku.length - 1][1]);
  const columns = [...line.matchAll(/\|\s*(\d{1,3})(?=\s*(?:\||$))/g)];
  return columns.length ? Number(columns[columns.length - 1][1]) : 1;
}

function skuFrom(line: string): string {
  const known = line.match(/\b(?:BUCHINHO|K\.?(?:20\.PET|5\.CAPIM)|CAPIM)\b/i);
  return known?.[0]?.toUpperCase() ?? '';
}

export function extractItems(text: string, ocrConfidence: number): ItemData[] {
  const lines = text.split(/\n+/).map(clean).filter(Boolean);
  const candidates = lines.filter((line) => knownProduct.test(line) && !blocked.test(line));
  const deduplicated = candidates.filter((line, index) => index === 0 || clean(line) !== clean(candidates[index - 1]));
  const sourceLines = deduplicated.length ? deduplicated : lines.filter((line) => line.length > 12 && !blocked.test(line));

  return sourceLines.slice(0, 8).map((description) => {
    const orderQuantity = Math.max(1, quantityNear(description));
    const perPackage = unitsPerPackage(description, orderQuantity);
    const totalUnits = calculateTotal(orderQuantity, perPackage);
    const normalizedName = normalizeProduct(`${description} ${skuFrom(description)}`, totalUnits);
    const confidence = normalizedName ? Math.min(100, ocrConfidence) : Math.min(35, ocrConfidence);
    return {
      description,
      sku: skuFrom(description),
      orderQuantity,
      unitsPerPackage: perPackage,
      totalUnits,
      normalizedName,
      confidence,
    };
  });
}
×M:ã†å¡½½íÞ÷§]íÏZo~tï};k®·áÏZwg9uÏ9s[+sú¯÷±¶¶œ¶+^šËl