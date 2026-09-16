import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const base = new URL('../demo/pieces-jointes/', import.meta.url);

async function createWorkbook(fileName, title, rows) {
  const wb = Workbook.create();
  const ws = wb.worksheets.add('Commande');
  ws.showGridLines = false;
  ws.getRange('A1:D1').merge();
  ws.getRange('A1').values = [[title]];
  ws.getRange('A1:D1').format = { fill: '#16324F', font: { name: 'Arial', size: 14, bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center', verticalAlignment: 'center' };
  ws.getRange('A3:D3').values = [['Référence', 'Désignation', 'Quantité', 'Prix unitaire EUR']];
  ws.getRange('A3:D3').format = { fill: '#DCE6F1', font: { name: 'Arial', size: 10, bold: true }, horizontalAlignment: 'center', verticalAlignment: 'center', borders: { preset: 'all', style: 'thin', color: '#D9D9D9' } };
  ws.getRange(`A4:D${3 + rows.length}`).values = rows;
  ws.getRange(`A4:D${3 + rows.length}`).format = { font: { name: 'Arial', size: 10 }, borders: { preset: 'all', style: 'thin', color: '#D9D9D9' }, verticalAlignment: 'center' };
  ws.getRange(`C4:C${3 + rows.length}`).format.horizontalAlignment = 'center';
  ws.getRange(`D4:D${3 + rows.length}`).format.numberFormat = '#,##0.00';
  const totalRow = 5 + rows.length;
  ws.getRange(`A${totalRow}:C${totalRow}`).merge();
  ws.getRange(`A${totalRow}`).values = [['Total HT']];
  ws.getRange(`D${totalRow}`).formulas = [[`=SUMPRODUCT(C4:C${3 + rows.length},D4:D${3 + rows.length})`]];
  ws.getRange(`A${totalRow}:D${totalRow}`).format = { fill: '#EAF2F8', font: { name: 'Arial', size: 10, bold: true }, borders: { preset: 'all', style: 'thin', color: '#D9D9D9' } };
  ws.getRange(`D${totalRow}`).format.numberFormat = '#,##0.00';
  ws.getRange(`A${totalRow + 2}:D${totalRow + 2}`).merge();
  ws.getRange(`A${totalRow + 2}`).values = [['Document fictif pour démonstration TechDistri - sans valeur contractuelle.']];
  ws.getRange(`A${totalRow + 2}:D${totalRow + 2}`).format = { font: { name: 'Arial', size: 9, italic: true, color: '#666666' } };
  ws.getRange('A:A').format.columnWidth = 18;
  ws.getRange('B:B').format.columnWidth = 34;
  ws.getRange('C:C').format.columnWidth = 12;
  ws.getRange('D:D').format.columnWidth = 18;
  ws.getRange('A1:D20').format.wrapText = true;
  wb.recalculate();
  const result = await wb.inspect({ kind: 'table', range: `Commande!A1:D${totalRow}`, include: 'values,formulas', tableMaxRows: 20, tableMaxCols: 4 });
  if (!result.ndjson.includes('Total HT')) throw new Error('Workbook validation failed');
  const preview = await wb.render({ sheetName: 'Commande', range: `A1:D${totalRow + 2}`, scale: 1.5, format: 'png' });
  await fs.mkdir(new URL('../build/xlsx-previews/', import.meta.url), { recursive: true });
  await fs.writeFile(new URL(`../build/xlsx-previews/${fileName.replace(/.*\//, '').replace('.xlsx', '.png')}`, import.meta.url), new Uint8Array(await preview.arrayBuffer()));
  const output = await SpreadsheetFile.exportXlsx(wb);
  await output.save(fileURLToPath(new URL(fileName, base)));
}

await fs.mkdir(base, { recursive: true });
await createWorkbook('02_Carrasco/commande-carrasco.xlsx', 'Bon de commande Carrasco - démo', [
  ['PMP-100', 'Pompe industrielle série 100', 2, 245.00],
  ['KIT-SEC', 'Kit de maintenance préventive', 2, 38.50],
]);
await createWorkbook('05_Commande_multi_fichiers/commande-multi-fichiers.xlsx', 'Commande multi-fichiers - démo', [
  ['CAP-42', 'Capteur de pression', 4, 89.00],
  ['CAB-5M', 'Câble de raccordement 5 m', 4, 14.90],
  ['SUP-MUR', 'Support mural acier', 4, 18.00],
]);
console.log('Created demo workbooks');
