import { useState } from 'react';
import api from '../api';

export default function UploadExcelModal({ isOpen, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [mode, setMode] = useState('file'); // 'file' or 'paste'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function parseCsvString(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || !parts.some(Boolean)) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] || '';
      });
      results.push({
        senderName: row.Name || row.senderName || row['Lead Name'] || parts[0] || 'Imported Lead',
        senderCompany: row.Company || row.senderCompany || parts[1] || '',
        senderMobile: row.Phone || row.Mobile || row.senderMobile || parts[2] || '',
        senderEmail: row.Email || row.senderEmail || parts[3] || '',
        senderCity: row.City || row.senderCity || parts[4] || '',
        productName: row.Product || row.productName || parts[5] || 'General Product Requirement',
        queryMessage: row.Message || row.queryMessage || parts[6] || '',
        queryType: (row.Type || row.queryType || '').toUpperCase() === 'BL' ? 'BL' : 'W',
      });
    }

    return results;
  }

  async function handleUpload() {
    setError('');
    let parsedLeads = [];

    if (mode === 'paste') {
      if (!csvText.trim()) {
        setError('Please paste CSV or tab-separated text data.');
        return;
      }
      parsedLeads = parseCsvString(csvText);
    } else {
      if (!file) {
        setError('Please select a CSV or Excel file.');
        return;
      }
      const text = await file.text();
      parsedLeads = parseCsvString(text);
    }

    if (parsedLeads.length === 0) {
      setError('Could not parse any valid lead rows from file/text.');
      return;
    }

    setUploading(true);
    try {
      await api.post('/leads/import', { leads: parsedLeads });
      onUploaded();
      onClose();
      setFile(null);
      setCsvText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-[#1b1c20] text-slate-200 w-full max-w-lg rounded-2xl border border-[#2d2e35] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-[#25262c] hover:bg-[#303138] transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📊</span>
          <h2 className="font-display font-bold text-lg text-white">Upload Excel / CSV Leads</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Bulk import leads into your CRM database from CSV or Excel files.
        </p>

        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4 p-1 bg-[#121316] rounded-xl border border-[#2d2e35]">
          <button
            onClick={() => setMode('file')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
              mode === 'file' ? 'bg-[#25262c] text-amber-400 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            📁 File Upload (.csv)
          </button>
          <button
            onClick={() => setMode('paste')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
              mode === 'paste' ? 'bg-[#25262c] text-amber-400 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            📋 Paste CSV Data
          </button>
        </div>

        {mode === 'file' ? (
          <div className="border-2 border-dashed border-[#34363f] hover:border-amber-500/50 rounded-2xl p-8 text-center bg-[#121316]/50 transition-colors">
            <input
              type="file"
              accept=".csv,.txt"
              id="excel-file-input"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="excel-file-input" className="cursor-pointer block space-y-2">
              <div className="text-3xl">📥</div>
              <div className="text-xs font-bold text-white">
                {file ? file.name : 'Click to select CSV / Excel File'}
              </div>
              <div className="text-[11px] text-slate-400">
                Supports CSV format with columns: Name, Phone, Email, Product, City, Message
              </div>
            </label>
          </div>
        ) : (
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Paste comma-separated rows below:</label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Name, Phone, Email, Product, City&#10;Saba Mallick, +91-9876543210, saba@example.com, Packaging Box, Mumbai"
              className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl p-3 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#2d2e35] hover:border-slate-500 text-slate-300 text-xs font-semibold rounded-xl px-4 py-2.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50 shadow-md"
          >
            {uploading ? 'Importing Leads...' : 'Import Leads Now 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
