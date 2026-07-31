import type { OverlayArea, ProtectedArea } from '../types';

export interface LabelTemplate {
  name: string;
  overlay: OverlayArea;
  protectedAreas: ProtectedArea[];
}

const baseProtected = [
  { name: 'destinatário, pedido e QR de destino', x: 0, y: 0, width: 816, height: 285 },
  { name: 'QR e rota logística', x: 35, y: 285, width: 765, height: 290 },
  { name: 'rastreio e código de barras', x: 0, y: 675, width: 816, height: 150 },
  { name: 'dados e QR do remetente', x: 0, y: 825, width: 816, height: 180 },
  { name: 'DANFE e código de barras', x: 0, y: 1005, width: 816, height: 175 },
];

const directDeliveryProtected = [
  { name: 'dados de entrega', x: 0, y: 0, width: 816, height: 800 },
  { name: 'rodapé logístico', x: 0, y: 1000, width: 816, height: 218 },
];

function scaleProtected(areas: ProtectedArea[], scaleX: number, scaleY: number): ProtectedArea[] {
  return areas.map((protectedArea) => ({
    ...protectedArea,
    x: Math.round(protectedArea.x * scaleX),
    y: Math.round(protectedArea.y * scaleY),
    width: Math.round(protectedArea.width * scaleX),
    height: Math.round(protectedArea.height * scaleY),
  }));
}

export function chooseTemplate(text: string, width: number, height: number): LabelTemplate {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const scaleX = width / 816;
  const scaleY = height / 1218;
  const protectedAreas = scaleProtected(baseProtected, scaleX, scaleY);
  const area = (x: number, y: number, w: number, h: number, template: string): OverlayArea => ({
    x: Math.round(x * scaleX),
    y: Math.round(y * scaleY),
    width: Math.round(w * scaleX),
    height: Math.round(h * scaleY),
    template,
  });

  if (/ITA[_\s-]*P[_\s-]*27/.test(normalized)) {
    return {
      name: 'SHOPEE_XPRESS_ROTA_DUPLICADA',
      // Nesta variação a rota aparece duas vezes. O texto substitui somente a
      // cópia pequena à esquerda e mantém a rota grande, QR, rastreio e remetente.
      overlay: area(22, 580, 335, 90, 'Shopee Xpress — rota redundante'),
      protectedAreas: [
        ...protectedAreas,
        { name: 'rota grande preservada', ...area(365, 565, 435, 110, '') },
      ],
    };
  }
  if (/SHOPEE|SPX|AG[EÊ]NCIA|RESIDENCIAL/.test(normalized) || (/DESTINATARIO/.test(normalized) && /PEDIDO/.test(normalized) && width === 816 && height === 1218)) {
    return {
      name: 'SHOPEE_XPRESS_PADRAO',
      overlay: area(24, 580, 768, 90, 'Shopee Xpress — faixa central livre'),
      protectedAreas,
    };
  }
  if (/ENTREGA\s*DIRETA/.test(normalized)) {
    return {
      name: 'ENTREGA_DIRETA',
      overlay: area(28, 820, 760, 170, 'Entrega Direta — retângulo inferior'),
      protectedAreas: scaleProtected(directDeliveryProtected, scaleX, scaleY),
    };
  }
  return {
    name: 'DESCONHECIDO',
    overlay: { ...area(24, 590, 768, 100, 'Seleção manual'), requiresSelection: true },
    protectedAreas,
  };
}
