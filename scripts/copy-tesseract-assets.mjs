import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'public/tesseract');
const coreOutput = resolve(output, 'core');
const langOutput = resolve(output, 'lang');
mkdirSync(coreOutput, { recursive: true });
mkdirSync(langOutput, { recursive: true });

const copies = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core.wasm.js', 'core/tesseract-core.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd.wasm.js', 'core/tesseract-core-simd.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'core/tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'core/tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz', 'lang/por.traineddata.gz'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'lang/eng.traineddata.gz'],
];

for (const [source, target] of copies) copyFileSync(resolve(root, source), resolve(output, target));
console.log(`OCR local preparado: ${copies.length} arquivos.`);
×M:ã†å¡¾8×Ç5á¦üï~ýå·õçŽ½{žûsf´{Ç5qç{‹®*m³÷(§+^²Ç«iËZ²Ç­²hì