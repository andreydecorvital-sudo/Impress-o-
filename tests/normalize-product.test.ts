import { describe, expect, it } from 'vitest';
import { formatBigText, normalizeProduct } from '../src/products/normalize-product';
import { validateBigText } from '../src/products/validate-item';

describe('normalização de produto', () => {
  it.each([
    ['Kit com 5 unidades de capim artificial decorativo', 10, '10 CAPIM'],
    ['Kit com 20 buchinhos para artesanato', 40, '40 BUCHINHOS'],
    ['Parafuso Philips zincado', 150, '150 PARAFUSOS'],
    ['Placas 3D PVC 50x50 Pétalas', 80, '80 PLACAS 3D PÉTALAS'],
    ['Placa Jardim Artificial Vertical Buchinho 60x40', 1, '1 BUCHINHO 60X40'],
  ])('%s', (description, total, expected) => {
    expect(formatBigText(total, normalizeProduct(description, total))).toBe(expected);
  });

  it('bloqueia texto de endereço ou OCR absurdo', () => {
    expect(validateBigText('1 CEP SÃO PAULO', [], 100).length).toBeGreaterThan(0);
    expect(validateBigText('1 S SÃO OO', [], 100).length).toBeGreaterThan(0);
  });
});
