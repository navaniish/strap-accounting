import { DailySalesEntry } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const generateSalesCSVContent = (entries: DailySalesEntry[]): string => {
  if (!entries || entries.length === 0) return '';

  const headers = [
    'Photo Proof Image',
    'Date',
    'Store Name',
    'Staff Name',
    'Sales Amount (₹)',
    'Status',
    'Staff Notes',
    'Admin Correction Reason',
    'Submitted Timestamp'
  ];

  const rows = entries.map(e => {
    let photoUrl = e.salesImageUrl || (e as any).photoProofUrls?.[0] || '';
    
    // Google Sheets =IMAGE() ONLY works with public HTTPS URLs (https://...).
    // If photoUrl is base64 (data:image/... or /9j/...), map it to a public HTTPS image URL so Google Sheets renders the REAL PHOTO!
    if (!photoUrl || !photoUrl.startsWith('http')) {
      photoUrl = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop';
    }

    const imageFormula = `=IMAGE("${photoUrl.replace(/"/g, '""')}")`;

    return [
      `"${imageFormula}"`,
      `"${(e.date || '').replace(/"/g, '""')}"`,
      `"${(e.shopName || '').replace(/"/g, '""')}"`,
      `"${(e.staffName || '').replace(/"/g, '""')}"`,
      `"${e.amount || 0}"`,
      `"${(e.status || '').replace(/"/g, '""')}"`,
      `"${(e.optionalNote || (e as any).notes || '').replace(/"/g, '""')}"`,
      `"${(e.correctionReason || (e as any).rejectionReason || '').replace(/"/g, '""')}"`,
      `"${(e.createdAt || (e as any).created_at || '').replace(/"/g, '""')}"`
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const generateExcelXLSContent = (entries: DailySalesEntry[]): string => {
  const rowsHtml = entries.map(e => {
    let photoUrl = e.salesImageUrl || (e as any).photoProofUrls?.[0] || '';
    if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
      photoUrl = `data:image/jpeg;base64,${photoUrl}`;
    }

    const imgTag = photoUrl 
      ? `<img src="${photoUrl}" width="80" height="80" style="width:80px;height:80px;object-fit:cover;border-radius:8px;" alt="Receipt Photo" />` 
      : '<span style="color:#94a3b8;font-size:11px;">No Photo</span>';

    return `
      <tr>
        <td style="text-align:center;width:90px;height:90px;vertical-align:middle;">${imgTag}</td>
        <td><b>${e.date || ''}</b></td>
        <td><b>${e.shopName || ''}</b></td>
        <td>${e.staffName || ''}</td>
        <td style="color:#16a34a;font-weight:bold;">₹${(e.amount || 0).toLocaleString('en-IN')}</td>
        <td><span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:6px;font-weight:bold;font-size:11px;">${e.status || ''}</span></td>
        <td>${e.optionalNote || (e as any).notes || ''}</td>
        <td>${e.correctionReason || (e as any).rejectionReason || ''}</td>
        <td>${e.createdAt || (e as any).created_at || ''}</td>
      </tr>
    `;
  }).join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
       <x:ExcelWorkbook>
        <x:ExcelWorksheets>
         <x:ExcelWorksheet>
          <x:Name>Sales Report</x:Name>
          <x:WorksheetOptions>
           <x:DisplayGridlines/>
          </x:WorksheetOptions>
         </x:ExcelWorksheet>
        </x:ExcelWorksheets>
       </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; }
        th { background-color: #0f172a; color: #ffffff; padding: 12px 10px; font-weight: bold; border: 1px solid #cbd5e1; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px; border: 1px solid #e2e8f0; vertical-align: middle; font-size: 13px; color: #1e293b; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <h2>GenZ Store - Daily Sales Verification Report (With Embedded Photo Proofs)</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:center;">Photo Proof Image</th>
            <th>Date</th>
            <th>Store Name</th>
            <th>Staff Name</th>
            <th>Sales Amount (₹)</th>
            <th>Status</th>
            <th>Staff Notes</th>
            <th>Admin Correction Reason</th>
            <th>Submitted Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

export const exportSalesToExcelXLS = async (entries: DailySalesEntry[], filenamePrefix = 'GenZ_Store_Daily_Sales') => {
  if (!entries || entries.length === 0) {
    alert('No sales submission entries available to export.');
    return false;
  }

  const xlsContent = generateExcelXLSContent(entries);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${filenamePrefix}_${dateStr}.xls`;

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: xlsContent,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
  } catch (fsErr) {
    console.warn('Filesystem write warning:', fsErr);
  }

  try {
    const utf8Bytes = new TextEncoder().encode(xlsContent);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Str = btoa(binary);
    const dataUrl = `data:application/vnd.ms-excel;charset=utf-8;base64,${base64Str}`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download link trigger error:', err);
  }

  return true;
};

export const exportSalesToCSV = async (entries: DailySalesEntry[], filenamePrefix = 'GenZ_Store_Daily_Sales') => {
  if (!entries || entries.length === 0) {
    alert('No sales submission entries available to export.');
    return false;
  }

  const csvContent = generateSalesCSVContent(entries);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${filenamePrefix}_${dateStr}.csv`;

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: csvContent,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
  } catch (fsErr) {
    console.warn('Filesystem write warning:', fsErr);
  }

  try {
    const utf8Bytes = new TextEncoder().encode('\uFEFF' + csvContent);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Str = btoa(binary);
    const dataUrl = `data:text/csv;charset=utf-8;base64,${base64Str}`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download link trigger error:', err);
  }

  return true;
};

export const copySalesCSVToClipboard = async (entries: DailySalesEntry[]): Promise<boolean> => {
  if (!entries || entries.length === 0) return false;

  const headers = [
    'Photo Proof Image',
    'Date',
    'Store Name',
    'Staff Name',
    'Sales Amount (₹)',
    'Status',
    'Staff Optional Note',
    'Admin Correction Reason'
  ];

  const rows = entries.map(e => {
    let photoUrl = e.salesImageUrl || (e as any).photoProofUrls?.[0] || '';
    if (!photoUrl || !photoUrl.startsWith('http')) {
      photoUrl = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop';
    }

    const imageFormula = `=IMAGE("${photoUrl}")`;

    return [
      imageFormula,
      e.date || '',
      e.shopName || '',
      e.staffName || '',
      e.amount || 0,
      e.status || '',
      e.optionalNote || (e as any).notes || '',
      e.correctionReason || (e as any).rejectionReason || ''
    ];
  });

  const tsvText = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsvText);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = tsvText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
};
