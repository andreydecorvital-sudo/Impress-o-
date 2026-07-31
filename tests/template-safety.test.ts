import { describe, expect, it } from 'vitest';
import { chooseTemplate } from '../src/label/templates';
import { validateOverlay } from '../src/label/validate-overlay';

describe('segurança dos templates', () => {
  it('usa a faixa central sem cobrir informações obrigatórias', () => {
    const template = chooseTemplate('SHOPEE RESIDENCIAL PEDIDO', 816, 1218);
    expect(validateOverlay(template.overlay, template.protectedAreas, 816, 1218)).toEqual([]);
  });

  it('preserva remetente e rota grande na variação ITA_P_27', () => {
    const template = chooseTemplate('SHOPEE ITA_P_27', 816, 1218);
    expect(template.name).toBe('SHOPEE_XPRESS_ROTA_DUPLICADA');
    expect(template.overlay.y).toBe(580);
    expect(template.overlay.y + template.overlay.height).toBeLessThan(675);
    expect(validateOverlay(template.overlay, template.protectedAreas, 816, 1218)).toEqual([]);
  });

  it('bloqueia uma área sobre os dados do remetente', () => {
    const template = chooseTemplate('SHOPEE ITA_P_27', 816, 1218);
    const unsafe = { x: 22, y: 855, width: 465, height: 95, template: 'insegura' };
    expect(validateOverlay(unsafe, template.protectedAreas, 816, 1218)[0]).toContain('remetente');
  });

  it('mantém utilizável o template de Entrega Direta', () => {
    const template = chooseTemplate('ENTREGA DIRETA', 816, 1218);
    expect(validateOverlay(template.overlay, template.protectedAreas, 816, 1218)).toEqual([]);
  });
});
