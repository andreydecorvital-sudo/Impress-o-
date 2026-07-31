import { describe, expect, it } from 'vitest';
import { parseZpl } from '../src/zpl/parse-zpl';
import { buildFinalZpl } from '../src/zpl/build-zpl';

describe('parser e gerador ZPL', () => {
  const raw = '~DGR:ONE.GRF,124236,102,:Z64:eJw=^XA^FO0,0^XGR:ONE.GRF,1,1^FS^PQ1^XZ^XA^IDR:ONE.GRF^FS^XZ';

  it('preserva o gráfico e encontra o bloco que o imprime', () => {
    const pages = parseZpl(raw);
    expect(pages).toHaveLength(1);
    expect(pages[0].graphic.name).toBe('R:ONE.GRF');
    expect(pages[0].printBlock).toContain('^XGR:ONE.GRF');
  });

  it('gera ZPL real sem rasterizar novamente a página', () => {
    const [page] = parseZpl(raw);
    const result = buildFinalZpl([{ page, text: '10 CAPIM', area: { x: 5, y: 2, width: 100, height: 40, template: 'teste' } }]);
    expect(result).toContain(page.graphic.originalCommand);
    expect(result).toContain('^FD10 CAPIM^FS');
    expect(result).toContain('^PQ1,0,0,N');
    expect(result).not.toContain('^GFA');
  });

  it('reduz a largura da fonte para não cortar uma descrição longa', () => {
    const [page] = parseZpl(raw);
    const result = buildFinalZpl([{
      page,
      text: '80 PLACAS 3D PETALAS',
      area: { x: 24, y: 580, width: 768, height: 90, template: 'teste longo' },
    }]);
    const font = result.match(/\^A0N,(\d+),(\d+)/);
    expect(font).not.toBeNull();
    expect(Number(font?.[2])).toBeLessThanOrEqual(Math.floor((768 - 24) / '80 PLACAS 3D PETALAS'.length));
    expect(result).toContain('^FD80 PLACAS 3D PETALAS^FS');
  });
});
