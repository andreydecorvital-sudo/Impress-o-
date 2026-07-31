import type { PageKind } from '../types';

export function normalizeKey(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function extractOrderKeys(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /(?:PEDIDO|ORDER)\s*[:#-]?\s*([A-Z0-9-]{10,30})/gi,
    /\b(\d{6,}[A-Z][A-Z0-9]{5,})\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) found.add(normalizeKey(match[1]));
  }
  return [...found];
}

export function extractTrackingKeys(text: string): string[] {
  return [...new Set([...text.matchAll(/\b(BR\d{10,14}[A-Z])\b/gi)].map((match) => normalizeKey(match[1])))];
}

export function classifyPage(text: string): { kind: PageKind; shippingScore: number; detailScore: number } {
  const value = text.toLowerCase();
  let shippingScore = 0;
  let detailScore = 0;
  if (/destinat[aÃ¡]rio|recebedor|endere[cÃ§]o|bairro|cep/.test(value)) shippingScore += 5;
  if (/rastreio|tracking|pedido/.test(value)) shippingScore += 3;
  if (/shopee\s*xpress|entrega\s*direta|correios|sedex|ag[eÃª]ncia|residencial/.test(value)) shippingScore += 3;
  if (/c[oÃ³]digo de barras|danfe|remetente/.test(value)) shippingScore += 2;
  if (/declara[cÃ§][aÃ£]o de conte[uÃº]do/.test(value)) detailScore += 8;
  if (/checklist(?: de carregamento)?/.test(value)) detailScore += 8;
  if (/produto|descri[cÃ§][aÃ£]o|varia[cÃ§][aÃ£]o|quantidade|qtd|sku/.test(value)) detailScore += 5;
  if (/valor unit[aÃ¡]rio|valor total|seller sku/.test(value)) detailScore += 2;
  if (shippingScore >= 5 && shippingScore > detailScore) return { kind: 'shipping', shippingScore, detailScore };
  if (detailScore >= 6) return { kind: /declara[cÃ§][aÃ£]o/.test(value) ? 'declaration' : 'checklist', shippingScore, detailScore };
  return { kind: 'unknown', shippingScore, detailScore };
}
×M:ã†å¡¶¹ñÏyáÆôÓ¯wŸïNûk®õwÜyŞiştë›+súZë?rV¬²'ò¥¨²Û