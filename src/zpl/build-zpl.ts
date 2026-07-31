import type { OverlayArea, ZplPage } from '../types';
import { splitBigText } from '../label/render-preview';

function safeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\^~]/g, '')
    .replace(/[^A-Z0-9 .,+\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function overlayCommands(text: string, area: OverlayArea): string {
  const lines = splitBigText(text).map(safeText).filter(Boolean);
  const lineHeight = Math.max(14, Math.min(92, Math.floor(area.height / Math.max(1, lines.length) * 0.72)));
  const totalHeight = lines.length * lineHeight;
  const startY = area.y + Math.max(4, Math.floor((area.height - totalHeight) / 2));
  const commands = [`^FO${area.x},${area.y}^GB${area.width},${area.height},${area.height},W^FS`, `^FO${area.x},${area.y}^GB${area.width},${area.height},3,B^FS`];
  lines.forEach((line, index) => {
    const widthThatFits = Math.floor((area.width - 24) / Math.max(1, line.length));
    const charWidth = Math.max(8, Math.min(Math.round(lineHeight * 0.82), widthThatFits));
    commands.push(`^FO${area.x + 8},${startY + index * lineHeight}^A0N,${lineHeight},${charWidth}^FB${area.width - 16},1,0,C,0^FD${line}^FS`);
  });
  return commands.join('\n');
}

function assertArea(page: ZplPage, area: OverlayArea): void {
  if (area.x < 0 || area.y < 0 || area.width <= 0 || area.height <= 0
    || area.x + area.width > page.graphic.width || area.y + area.height > page.graphic.height) {
    throw new Error(`A área "${area.template}" está fora dos limites da etiqueta.`);
  }
}

export function buildFinalPage(page: ZplPage, text: string, area: OverlayArea): string {
  const lines = splitBigText(text).map(safeText).filter(Boolean);
  if (!lines.length) throw new Error('O texto grande está vazio.');
  assertArea(page, area);
  let print = page.printBlock.replace(/\^PQ[^\^]*/gi, '');
  print = print.replace(/\^XZ\s*$/i, '');
  const width = page.graphic.width;
  const height = page.graphic.height;
  if (!/\^PW\d+/i.test(print)) print = print.replace(/^\^XA/i, `^XA\n^PW${width}`);
  if (!/\^LL\d+/i.test(print)) print = print.replace(/^\^XA/i, `^XA\n^LL${height}`);
  return [
    page.graphic.originalCommand,
    print,
    overlayCommands(lines.join('\n'), area),
    '^PQ1,0,0,N',
    '^XZ',
    `^XA^ID${page.graphic.name}^FS^XZ`,
  ].join('\n');
}

export function buildFinalZpl(entries: Array<{ page: ZplPage; text: string; area: OverlayArea }>): string {
  if (!entries.length) throw new Error('Não há etiquetas confirmadas.');
  const output = `${entries.map((entry) => buildFinalPage(entry.page, entry.text, entry.area)).join('\n\n')}\n`;
  if (/\^GFA,/i.test(output)) throw new Error('A geração tentou rasterizar a etiqueta inteira e foi bloqueada.');
  const printCount = output.match(/\^PQ1,0,0,N/gi)?.length ?? 0;
  if (printCount !== entries.length) throw new Error('A quantidade de páginas finais está incorreta.');
  for (const entry of entries) {
    const lines = splitBigText(entry.text).map(safeText).filter(Boolean);
    if (lines.some((line) => !output.includes(`^FD${line}^FS`))) {
      throw new Error('O texto grande não foi incorporado ao ZPL final.');
    }
  }
  return output;
}
