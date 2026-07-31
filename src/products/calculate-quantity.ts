const packageWords = '(?:kits?|pacotes?|caixas?|conjuntos?|jogos?|fardos?)';

export function unitsPerPackage(description: string, orderQuantity = 1): number {
  const text = description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|kg|g|ml|l|v|w)\b/gi, ' ')
    .replace(/\b\d+\s*[x×]\s*\d+\s*(?:mm|cm|m)?\b/gi, (match) => {
      const numbers = match.match(/\d+/g)?.map(Number) ?? [];
      return numbers.length === 2 && (numbers[0] !== orderQuantity || numbers[0] > 20) ? ' ' : match;
    });

  const explicit = [
    new RegExp(`${packageWords}\\s*(?:de|com|c\\/)?\\s*(\\d+)`, 'i'),
    /(?:cont[eé]m|com|c\/)\s*(\d+)\s*(?:unidades?|pe[cç]as?|pcs?|placas?|capins?|buchinhos?|parafusos?)/i,
    /(\d+)\s*(?:unidades?|pe[cç]as?|pcs?)\s*(?:por|no|na|em cada)\s*(?:kit|pacote|caixa|conjunto)/i,
    /\b(\d+)\s*(?:unidades?|pe[cç]as?|pcs?)\b/i,
  ];
  for (const pattern of explicit) {
    const match = text.match(pattern);
    if (match) return Math.max(1, Number(match[1]));
  }

  const multiplication = text.match(/\b(\d+)\s*[x×]\s*(\d+)\s+(?=[a-z])/i);
  if (multiplication && Number(multiplication[1]) === orderQuantity) return Math.max(1, Number(multiplication[2]));
  return 1;
}

export function calculateTotal(orderQuantity: number, packageQuantity: number): number {
  if (!Number.isFinite(orderQuantity) || !Number.isFinite(packageQuantity)) return 0;
  if (orderQuantity <= 0 || packageQuantity <= 0) return 0;
  return Math.round(orderQuantity) * Math.round(packageQuantity);
}
