import { describe, expect, it } from 'vitest';
import { parseZpl } from '../src/zpl/parse-zpl';
import { buildFinalZpl } from '../src/zpl/build-zpl';
import { extractItems } from '../src/ocr/extract-items';
import { formatBigText } from '../src/products/normalize-product';

describe('arquivo real da Shopee', () => {
  const source = Array.from({ length: 6 }, (_, index) =>
    `~DGR:P${index}.GRF,124236,102,:Z64:eJw=^XA^FO0,0^XGR:P${index}.GRF,1,1^FS^PQ1^XZ^XA^IDR:P${index}.GRF^FS^XZ`,
  ).join('\n');

  it('contÃ©m seis pÃ¡ginas grÃ¡ficas e gera somente trÃªs etiquetas', () => {
    const pages = parseZpl(source);
    expect(pages).toHaveLength(6);
    const final = buildFinalZpl([
      { page: pages[0], text: '1 BUCHINHO 60X40', area: { x: 24, y: 580, width: 768, height: 90, template: 'padrÃ£o' } },
      { page: pages[2], text: '80 PLACAS 3D PETALAS\n1 CAPIM', area: { x: 24, y: 580, width: 768, height: 90, template: 'padrÃ£o' } },
      { page: pages[4], text: '5 CAPIM', area: { x: 22, y: 580, width: 335, height: 90, template: 'rota redundante' } },
    ]);
    expect(final.match(/\^PQ1,0,0,N/g)).toHaveLength(3);
    expect(final.match(/~DGR:P[024]\.GRF/g)).toHaveLength(3);
    expect(final).not.toContain('Checklist de carregamento');
    expect(final).not.toContain('^GFA');
    expect(final).toContain('^FD80 PLACAS 3D PETALAS^FS');
    expect(final).toContain('^FD5 CAPIM^FS');
  });

  it('interpreta o OCR real de mÃºltiplos itens e quantidades internas', () => {
    const text = `
      1 |Placas 3D PVC 50x50 | Renove sua Parede com PÃ©talas,20 Unidades (R$5,60 Un) 4 K.20.PET
      2 |1 Unidade Capim dos Pampas Artificial 70cm | 1 ICAPIM
    `;
    const items = extractItems(text, 90);
    expect(items.map((item) => formatBigText(item.totalUnits, item.normalizedName))).toEqual([
      '80 PLACAS 3D PÃ‰TALAS',
      '1 CAPIM',
    ]);
  });

  it('interpreta kit de cinco sem multiplicar a medida de 70 cm', () => {
    const [item] = extractItems('1 |5 Unidades Capim dos Pampas Artificial 70cm | 1 IK.5.CAPIM', 90);
    expect(formatBigText(item.totalUnits, item.normalizedName)).toBe('5 CAPIM');
  });
});
×M:ã†å¡·<ãnüq¶ßÕþõßmq÷›ã_^ÛÞz÷Ï4mí½Ñû^²Û?­æ¥~)^Š{^‚¶­Š‰ízËm