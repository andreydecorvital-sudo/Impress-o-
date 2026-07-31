export type PageKind = 'shipping' | 'checklist' | 'declaration' | 'unknown';

export interface ZplGraphic {
  name: string;
  totalBytes: number;
  bytesPerRow: number;
  width: number;
  height: number;
  z64: string;
  checksum?: string;
  originalCommand: string;
}

export interface ZplPage {
  index: number;
  graphic: ZplGraphic;
  printBlock: string;
  source: string;
}

export interface PageAnalysis {
  page: ZplPage;
  canvas: HTMLCanvasElement;
  text: string;
  confidence: number;
  kind: PageKind;
  orderKeys: string[];
  trackingKeys: string[];
}

export interface PairResult {
  shipping: PageAnalysis;
  detail: PageAnalysis | null;
  confidence: number;
  reason: string;
  requiresConfirmation: boolean;
}

export interface ItemData {
  description: string;
  sku: string;
  orderQuantity: number;
  unitsPerPackage: number;
  totalUnits: number;
  normalizedName: string;
  confidence: number;
}

export interface OverlayArea {
  x: number;
  y: number;
  width: number;
  height: number;
  template: string;
  requiresSelection?: boolean;
}

export interface ProtectedArea {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReviewOrder {
  id: string;
  pair: PairResult;
  items: ItemData[];
  rawItemText: string;
  bigText: string;
  overlay: OverlayArea;
  protectedAreas: ProtectedArea[];
  confirmed: boolean;
  valid: boolean;
  errors: string[];
}
×M:ã†å¡¿uë·úáİ[õ×»s¾zmÿ_kzwwxá·üÓŸ{ÑË+sûr¥ë-