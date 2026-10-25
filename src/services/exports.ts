import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportXlsx(fileName: string, sheetName: string, rows: Record<string, unknown>[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  if (rows.length) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 18 }));
    sheet.addRows(rows);
  }
  const blob = new Blob([await workbook.xlsx.writeBuffer()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, fileName);
}

export function exportPdf(title: string, headers: string[], rows: string[][], fileName: string): void {
  const document = new jsPDF({ orientation: 'landscape' });
  document.text(title, 14, 14);
  autoTable(document, { head: [headers], body: rows, startY: 20, styles: { fontSize: 8 } });
  document.save(fileName);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
