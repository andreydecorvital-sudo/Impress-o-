import './style.css';
import { parseZpl } from './zpl/parse-zpl';
import { analyzePages } from './ocr/run-ocr';
import { pairPages } from './pages/pair-pages';
import { extractItems } from './ocr/extract-items';
import { calculateTotal } from './products/calculate-quantity';
import { formatBigText, normalizeProduct } from './products/normalize-product';
import { chooseTemplate } from './label/templates';
import { bindOverlaySelector } from './label/choose-overlay-area';
import { renderPreview } from './label/render-preview';
import { validateOverlay } from './label/validate-overlay';
import { validateBigText } from './products/validate-item';
import { buildFinalZpl } from './zpl/build-zpl';
import type { ItemData, ReviewOrder } from './types';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principal não encontrado.');

app.innerHTML = `
  <header class="topbar"><div class="shell brand">Etiqueta ZPL <span>Otimizada</span></div></header>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">SEPARAÇÃO MAIS RÁPIDA · PROCESSAMENTO LOCAL</p>
      <h1>O item certo,<br><em>grande na etiqueta.</em></h1>
      <p class="lead">Envie o ZPL da Shopee. A ferramenta preserva a etiqueta original, usa o checklist somente para ler os itens e gera uma página final por pedido.</p>
    </section>
    <section class="upload-card" id="upload-card">
      <div>
        <h2>1. Selecione o arquivo ZPL</h2>
        <p>Arquivo <strong>.txt</strong> ou <strong>.zpl</strong> com etiquetas e checklists.</p>
      </div>
      <label class="file-button">Escolher arquivo<input id="file" type="file" accept=".txt,.zpl,text/plain"></label>
      <span class="file-name" id="file-name">Nenhum arquivo selecionado</span>
      <details class="paste"><summary>Ou cole o ZPL</summary><textarea id="zpl" spellcheck="false" placeholder="Cole aqui o conteúdo ZPL completo..."></textarea></details>
      <button class="button primary" id="analyze" type="button">Analisar pedidos</button>
      <div class="status" id="status" role="status">Aguardando arquivo.</div>
      <div class="progress" aria-hidden="true"><span id="progress"></span></div>
    </section>
    <section id="review" class="review hidden">
      <div class="section-heading"><div><p class="eyebrow">REVISÃO OBRIGATÓRIA</p><h2>2. Confira cada pedido</h2></div><span id="counter" class="counter"></span></div>
      <div id="orders"></div>
      <div class="export-bar">
        <div><strong id="export-title">Confirme todos os pedidos</strong><p id="export-help">O download só será liberado quando todos os textos estiverem válidos.</p></div>
        <button class="button primary" id="download" type="button" disabled>Baixar ZPL final</button>
      </div>
    </section>
  </main>
`;

const fileInput = document.querySelector<HTMLInputElement>('#file')!;
const textarea = document.querySelector<HTMLTextAreaElement>('#zpl')!;
const analyzeButton = document.querySelector<HTMLButtonElement>('#analyze')!;
const status = document.querySelector<HTMLDivElement>('#status')!;
const progress = document.querySelector<HTMLSpanElement>('#progress')!;
const review = document.querySelector<HTMLElement>('#review')!;
const ordersContainer = document.querySelector<HTMLDivElement>('#orders')!;
const downloadButton = document.querySelector<HTMLButtonElement>('#download')!;
const counter = document.querySelector<HTMLSpanElement>('#counter')!;
let sourceZpl = '';
let reviews: ReviewOrder[] = [];
let finalZpl = '';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function setStatus(message: string, kind: 'normal' | 'working' | 'error' | 'success' = 'normal'): void {
  status.textContent = message;
  status.dataset.kind = kind;
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  sourceZpl = await file.text();
  textarea.value = sourceZpl;
  document.querySelector('#file-name')!.textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
  setStatus('Arquivo carregado. Pronto para analisar.', 'success');
});

textarea.addEventListener('input', () => { sourceZpl = textarea.value; });

function itemText(items: ItemData[]): string {
  return items.filter((item) => item.totalUnits > 0 && item.normalizedName)
    .map((item) => formatBigText(item.totalUnits, item.normalizedName)).join('\n');
}

function validateReview(order: ReviewOrder): void {
  const pairingConfidence = order.pair.requiresConfirmation ? 0 : Math.max(70, order.pair.confidence);
  order.errors = validateBigText(order.bigText, order.items, pairingConfidence);
  if (order.overlay.requiresSelection) order.errors.push('Selecione manualmente a área do texto na etiqueta.');
  order.errors.push(...validateOverlay(
    order.overlay,
    order.protectedAreas,
    order.pair.shipping.canvas.width,
    order.pair.shipping.canvas.height,
  ));
  order.errors = [...new Set(order.errors)];
  order.valid = order.errors.length === 0;
  if (!order.valid) order.confirmed = false;
}

function refreshExport(): void {
  reviews.forEach(validateReview);
  const confirmed = reviews.filter((order) => order.confirmed && order.valid).length;
  counter.textContent = `${confirmed} de ${reviews.length} confirmados`;
  const ready = reviews.length > 0 && confirmed === reviews.length;
  downloadButton.disabled = !ready;
  document.querySelector('#export-title')!.textContent = ready ? `${reviews.length} etiquetas prontas` : 'Confirme todos os pedidos';
  document.querySelector('#export-help')!.textContent = ready
    ? 'O arquivo final terá uma página por pedido e nenhum checklist separado.'
    : 'O download só será liberado quando todos os textos estiverem válidos.';
  finalZpl = ready ? buildFinalZpl(reviews.map((order) => ({
    page: order.pair.shipping.page,
    text: order.bigText,
    area: order.overlay,
  }))) : '';
}

function updatePreview(order: ReviewOrder, previewHost: HTMLElement): void {
  previewHost.replaceChildren(renderPreview(order.pair.shipping.canvas, order.bigText || 'ITEM', order.overlay));
}

function renderOrder(order: ReviewOrder, index: number): HTMLElement {
  validateReview(order);
  const card = document.createElement('article');
  card.className = 'order-card';
  card.innerHTML = `
    <div class="order-head">
      <div><span class="order-number">PEDIDO ${index + 1}</span><h3>${escapeHtml(order.id)}</h3></div>
      <span class="confidence ${order.pair.confidence >= 70 ? 'good' : 'warn'}">Pareamento: ${escapeHtml(order.pair.reason)}</span>
    </div>
    <div class="preview-grid">
      <figure><figcaption>Etiqueta original</figcaption><div class="canvas-host original"></div></figure>
      <figure><figcaption>Prévia final</figcaption><div class="canvas-host modified"></div></figure>
    </div>
    <div class="review-grid">
      <div class="recognized">
        <h4>Itens reconhecidos</h4>
        <div class="items"></div>
        <details><summary>Texto lido na região de produtos</summary><pre>${escapeHtml(order.rawItemText || 'Nenhum texto reconhecido.')}</pre></details>
      </div>
      <div class="final-fields">
        <label>Texto grande<textarea class="big-text" rows="3">${escapeHtml(order.bigText)}</textarea></label>
        <p class="template">Área: <strong>${escapeHtml(order.overlay.template)}</strong></p>
        <button type="button" class="button secondary select-area">Selecionar outra área na prévia</button>
        ${order.pair.requiresConfirmation ? '<label class="check"><input class="pair-check" type="checkbox"> Conferi que o checklist pertence a este pedido</label>' : ''}
        <div class="errors"></div>
        <button type="button" class="button confirm">Confirmar pedido</button>
      </div>
    </div>
  `;

  const originalHost = card.querySelector<HTMLElement>('.original')!;
  const modifiedHost = card.querySelector<HTMLElement>('.modified')!;
  const originalCanvas = order.pair.shipping.canvas.cloneNode(true) as HTMLCanvasElement;
  originalCanvas.getContext('2d')?.drawImage(order.pair.shipping.canvas, 0, 0);
  originalHost.appendChild(originalCanvas);
  updatePreview(order, modifiedHost);

  const itemsHost = card.querySelector<HTMLElement>('.items')!;
  const itemRows = order.items.length ? order.items : [{
    description: '', sku: '', orderQuantity: 0, unitsPerPackage: 1, totalUnits: 0, normalizedName: '', confidence: 0,
  }];
  order.items = itemRows;
  itemRows.forEach((item, itemIndex) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <label class="wide">Descrição<input class="description" value="${escapeHtml(item.description)}"></label>
      <label>Qtd. comprada<input class="order-qty" type="number" min="1" max="9999" value="${item.orderQuantity || ''}"></label>
      <label>Por pacote<input class="package-qty" type="number" min="1" max="9999" value="${item.unitsPerPackage || 1}"></label>
      <label>Total<input class="total" value="${item.totalUnits || ''}" readonly></label>
      <label class="wide">Nome resumido<input class="name" value="${escapeHtml(item.normalizedName)}"></label>
    `;
    const sync = () => {
      item.description = row.querySelector<HTMLInputElement>('.description')!.value;
      item.orderQuantity = Number(row.querySelector<HTMLInputElement>('.order-qty')!.value);
      item.unitsPerPackage = Number(row.querySelector<HTMLInputElement>('.package-qty')!.value);
      item.totalUnits = calculateTotal(item.orderQuantity, item.unitsPerPackage);
      item.normalizedName = row.querySelector<HTMLInputElement>('.name')!.value.toUpperCase() || normalizeProduct(item.description, item.totalUnits);
      item.confidence = item.description && item.normalizedName ? 100 : 0;
      row.querySelector<HTMLInputElement>('.total')!.value = String(item.totalUnits || '');
      row.querySelector<HTMLInputElement>('.name')!.value = item.normalizedName;
      order.bigText = itemText(order.items);
      card.querySelector<HTMLTextAreaElement>('.big-text')!.value = order.bigText;
      order.confirmed = false;
      validateReview(order);
      showErrors();
      updatePreview(order, modifiedHost);
      refreshExport();
    };
    row.querySelectorAll('input:not(.total)').forEach((input) => input.addEventListener('change', sync));
    itemsHost.appendChild(row);
    if (itemIndex > 2) row.classList.add('compact');
  });

  const errorsHost = card.querySelector<HTMLElement>('.errors')!;
  const confirm = card.querySelector<HTMLButtonElement>('.confirm')!;
  const showErrors = () => {
    validateReview(order);
    errorsHost.innerHTML = order.errors.map((error) => `<p>${escapeHtml(error)}</p>`).join('');
    confirm.disabled = !order.valid;
    confirm.textContent = order.confirmed ? 'Pedido confirmado ✓' : 'Confirmar pedido';
    card.classList.toggle('confirmed', order.confirmed);
  };
  card.querySelector<HTMLTextAreaElement>('.big-text')!.addEventListener('input', (event) => {
    order.bigText = (event.target as HTMLTextAreaElement).value.toUpperCase();
    order.confirmed = false;
    updatePreview(order, modifiedHost);
    showErrors();
    refreshExport();
  });
  card.querySelector<HTMLInputElement>('.pair-check')?.addEventListener('change', (event) => {
    order.pair.requiresConfirmation = !(event.target as HTMLInputElement).checked;
    showErrors();
    refreshExport();
  });
  card.querySelector<HTMLButtonElement>('.select-area')!.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.textContent = 'Arraste sobre a prévia para marcar a área';
    modifiedHost.classList.add('selecting');
    const canvas = modifiedHost.querySelector('canvas')!;
    const unbind = bindOverlaySelector(canvas, (area) => {
      order.overlay = area;
      order.confirmed = false;
      unbind();
      modifiedHost.classList.remove('selecting');
      button.textContent = 'Selecionar outra área na prévia';
      card.querySelector<HTMLElement>('.template')!.innerHTML = `Área: <strong>${escapeHtml(area.template)}</strong>`;
      updatePreview(order, modifiedHost);
      showErrors();
      refreshExport();
    });
  });
  confirm.addEventListener('click', () => {
    validateReview(order);
    if (!order.valid) return;
    order.confirmed = true;
    showErrors();
    refreshExport();
  });
  showErrors();
  return card;
}

async function analyze(): Promise<void> {
  sourceZpl = textarea.value.trim() || sourceZpl.trim();
  if (!sourceZpl) { setStatus('Selecione ou cole um arquivo ZPL.', 'error'); return; }
  analyzeButton.disabled = true;
  review.classList.add('hidden');
  ordersContainer.replaceChildren();
  progress.style.width = '2%';
  try {
    const pages = parseZpl(sourceZpl);
    if (!pages.length) throw new Error('Nenhum gráfico Z64 foi encontrado no arquivo.');
    setStatus(`${pages.length} páginas encontradas. Iniciando leitura local...`, 'working');
    const analyses = await analyzePages(pages, (event) => {
      const percentage = Math.round(((event.page - 1 + event.progress) / event.total) * 88) + 4;
      progress.style.width = `${percentage}%`;
      setStatus(`Lendo página ${event.page} de ${event.total} · ${Math.round(event.progress * 100)}%`, 'working');
    });
    const pairs = pairPages(analyses);
    if (!pairs.length) throw new Error('Nenhuma etiqueta de envio foi reconhecida. Confira a qualidade do arquivo.');
    reviews = pairs.map((pair, index) => {
      const items = pair.detail ? extractItems(pair.detail.text, pair.detail.confidence) : [];
      const template = chooseTemplate(pair.shipping.text, pair.shipping.canvas.width, pair.shipping.canvas.height);
      return {
        id: pair.shipping.orderKeys[0] || `Página ${pair.shipping.page.index + 1}`,
        pair,
        items,
        rawItemText: pair.detail?.text ?? '',
        bigText: itemText(items),
        overlay: template.overlay,
        protectedAreas: template.protectedAreas,
        confirmed: false,
        valid: false,
        errors: [],
      };
    });
    reviews.forEach((order, index) => ordersContainer.appendChild(renderOrder(order, index)));
    progress.style.width = '100%';
    setStatus(`${reviews.length} pedidos encontrados. Revise os textos antes de baixar.`, 'success');
    review.classList.remove('hidden');
    refreshExport();
    review.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error(error);
    progress.style.width = '0';
    setStatus(error instanceof Error ? error.message : 'Não foi possível processar o arquivo.', 'error');
  } finally {
    analyzeButton.disabled = false;
  }
}

analyzeButton.addEventListener('click', analyze);
downloadButton.addEventListener('click', () => {
  if (!finalZpl) return;
  const blob = new Blob([finalZpl], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'etiquetas-com-itens-grandes.txt';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
