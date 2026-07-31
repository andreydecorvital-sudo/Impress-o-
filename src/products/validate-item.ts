import type { ItemData } from '../types';

const forbidden = /\b(?:CEP|PEDIDO|DESTINATARIO|ENDERECO|RASTREIO|REVISAR)\b/i;

export function validateBigText(text: string, items: ItemData[], pairConfidence: number): string[] {
  const errors: string[] = [];
  const value = text.trim();
  if (!value) errors.push('Informe o texto grande.');
  if (forbidden.test(value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) errors.push('O texto contém dados de endereço ou logística.');
  const letters = (value.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  const digits = (value.match(/\d/g) ?? []).length;
  if (letters < 2 || digits > letters * 2) errors.push('O texto não parece identificar um produto.');
  if (!items.length) errors.push('Nenhum item foi identificado na página pareada.');
  if (items.some((item) => item.totalUnits <= 0 || item.totalUnits > 9999)) errors.push('A quantidade está fora do intervalo permitido.');
  if (items.some((item) => item.confidence < 45)) errors.push('A leitura do produto está com baixa confiança; corrija manualmente.');
  if (pairConfidence < 70) errors.push('Confirme manualmente o pareamento das páginas.');
  if (/^\s*1\s+S\s+S[AÃ]O\s+O+\s*$/i.test(value)) errors.push('O texto reconhecido é inválido.');
  return [...new Set(errors)];
}
