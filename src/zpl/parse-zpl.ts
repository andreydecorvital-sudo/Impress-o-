import type { ZplGraphic, ZplPage } from '../types';

const graphicPattern = /(?:~DG|\^DG)([^,]+),(\d+),(\d+),:Z64:([A-Za-z0-9+/=]+)(?::([0-9A-Fa-f]+))?/g;

function normalizeName(name: string): string {
  return name.trim().toUpperCase();
}

export function splitZplBlocks(raw: string): string[] {
  return raw.match(/\^XA[\s\S]*?\^XZ/g) ?? [];
}

export function parseZpl(raw: string): ZplPage[] {
  if (!raw.trim()) return [];
  const matches = [...raw.matchAll(graphicPattern)];
  return matches.map((match, index) => {
    const name = match[1].trim();
    const totalBytes = Number(match[2]);
    const bytesPerRow = Number(match[3]);
    if (!totalBytes || !bytesPerRow) throw new Error(`Gráfico ${index + 1} possui dimensões inválidas.`);

    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? raw.length) : raw.length;
    const source = raw.slice(start, end);
    const blocks = splitZplBlocks(source);
    const wanted = normalizeName(name);
    const printBlock = blocks.find((block) => {
      const refs = [...block.matchAll(/\^XG([^,\^]+)(?:,[^\^]*)?/gi)].map((item) => normalizeName(item[1]));
      return refs.includes(wanted);
    });
    if (!printBlock) throw new Error(`O gráfico ${name} não possui um bloco de impressão ^XG correspondente.`);

    const graphic: ZplGraphic = {
      name,
      totalBytes,
      bytesPerRow,
      width: bytesPerRow * 8,
      height: Math.ceil(totalBytes / bytesPerRow),
      z64: match[4],
      checksum: match[5],
      originalCommand: match[0],
    };
    return { index, graphic, printBlock, source };
  });
}
