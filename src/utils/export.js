import * as XLSX from 'xlsx';

export function downloadExcel(data, filename = 'astrological_data.xlsx') {
  if (!data || data.length === 0) {
    console.warn('No data available to export');
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  const colWidths = [
    { wch: 20 }, // Date
    { wch: 10 }, // Planets
    { wch: 10 }, // Sign
    { wch: 15 }, // Degree
    { wch: 15 }, // Naks
    { wch: 10 }, // Lat
    { wch: 10 }, // Lon
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Astrological Data');
  XLSX.writeFile(wb, filename);
}
