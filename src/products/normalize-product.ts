const dictionary: Array<[RegExp, string]> = [
  [/\b(?:k\.?\s*\d+\.?\s*)?cap(?:im|ins)(?:\s+dos\s+pampas)?\b/i, 'CAPIM'],
  [/\bbuchinh(?:o|os)\b/i, 'BUCHINHO'],
  [/\bplacas?\s*3d.*p[eé]talas?\b/i, 'PLACAS 3D PÉTALAS'],
  [/\bbuchas?\s+(?:de\s+)?fixa[cç][aã]o\b/i, 'BUCHAS'],
  [/\bparafusos?(?:\s+philips)?\b/i, 'PARAFUSOS'],
  [/\bcolas?\b/i, 'COLA'],
];

const stopWords = new Set([
  'KIT', 'KITS', 'PACOTE', 'PACOTES', 'UNIDADE', 'UNIDADES', 'MODELO', 'TAMANHO', 'COR',
  'PARA', 'COM', 'DE', 'DA', 'DO', 'DAS', 'DOS', 'PROMOCAO', 'ENVIO', 'IMEDIATO', 'PRONTA',
  'ENTREGA', 'ARTIFICIAL', 'ARTIFICIAIS', 'DECORATIVO', 'DECORATIVA', 'REALISTA', 'MELHOR',
  'VOLUME', 'VERTICAL', 'PAREDE', 'PLUMA',
]);

function pluralize(name: string, total: number): string {
  if (total === 1) return name;
  if (name === 'BUCHINHO') return 'BUCHINHOS';
  if (name === 'COLA') return 'COLAS';
  return name;
}

export function normalizeProduct(description: string, total = 1): string {
  const normalized = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (/\bBUCHINH(?:O|OS)\b/.test(normalized) && /\b60\s*[X×]\s*40\b/.test(normalized)) {
    return `${total === 1 ? 'BUCHINHO' : 'BUCHINHOS'} 60X40`;
  }
  for (const [pattern, replacement] of dictionary) {
    if (pattern.test(description)) return pluralize(replacement, total);
  }

  const words = normalized
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:MM|CM|M|KG|G|ML|L|V|W)\b/g, ' ')
    .replace(/\b\d+\s*[X×]\s*\d+\b/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word));
  return words.slice(0, 3).join(' ') || '';
}

export function formatBigText(total: number, normalizedName: string): string {
  return `${total} ${pluralize(normalizedName, total)}`.trim();
}
