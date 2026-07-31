import { createWorker, PSM } from 'tesseract.js';
import type { PageAnalysis, ZplPage } from '../types';
import { graphicToCanvas } from '../zpl/decode-z64';
import { classifyPage, extractOrderKeys, extractTrackingKeys } from '../pages/classify-pages';
import { cropDeclarationHeader, cropDeclarationTable } from './crop-declaration';

export interface OcrProgress {
  page: number;
  total: number;
  progress: number;
  message: string;
}

export async function analyzePages(pages: ZplPage[], onProgress: (event: OcrProgress) => void): Promise<PageAnalysis[]> {
  let activePage = 0;
  const worker = await createWorker('por+eng', undefined, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/core',
    langPath: '/tesseract/lang',
    logger: (event) => {
      if (typeof event.progress === 'number') {
        onProgress({ page: activePage + 1, total: pages.length, progress: event.progress, message: event.status });
      }
    },
  });
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
  const analyses: PageAnalysis[] = [];
  try {
    for (let index = 0; index < pages.length; index += 1) {
      activePage = index;
      const page = pages[index];
      const canvas = graphicToCanvas(page.graphic);
      const full = await worker.recognize(canvas);
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      const header = await worker.recognize(cropDeclarationHeader(canvas));
      const table = await worker.recognize(cropDeclarationTable(canvas));
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      const fullText = full.data.text ?? '';
      const detailText = `${header.data.text ?? ''}\n${table.data.text ?? ''}`;
      const classified = classifyPage(`${fullText}\n${detailText}`);
      const text = classified.kind === 'shipping' ? fullText : detailText;
      const confidence = classified.kind === 'shipping'
        ? Number(full.data.confidence ?? 0)
        : Number(table.data.confidence ?? 0);
      analyses.push({
        page,
        canvas,
        text,
        confidence,
        kind: classified.kind,
        orderKeys: extractOrderKeys(`${fullText}\n${detailText}`),
        trackingKeys: extractTrackingKeys(`${fullText}\n${detailText}`),
      });
    }
  } finally {
    await worker.terminate();
  }
  return analyses;
}
