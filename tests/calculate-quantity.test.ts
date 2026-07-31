import { describe, expect, it } from 'vitest';
import { calculateTotal, unitsPerPackage } from '../src/products/calculate-quantity';

describe('cálculo de quantidade', () => {
  it.each([
    ['Kit com 5 capins', 2, 5, 10],
    ['Kit com 20 buchinhos', 2, 20, 40],
    ['Bucha 8 mm, kit com 20 unidades', 2, 20, 40],
    ['Pacote com 50 parafusos', 3, 50, 150],
    ['Placa 3D PVC 50x50, kit com 20 unidades', 4, 20, 80],
    ['Capim artificial 70 cm', 1, 1, 1],
  ])('%s', (description, orderQuantity, expectedPackage, expectedTotal) => {
    const packageQuantity = unitsPerPackage(description, orderQuantity);
    expect(packageQuantity).toBe(expectedPackage);
    expect(calculateTotal(orderQuantity, packageQuantity)).toBe(expectedTotal);
  });
});
