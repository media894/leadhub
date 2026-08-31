import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';

export default function BulkMail() {
  const [leads, setLeads] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState('Exclusive Proposal & Portfolio Presentation - Odd Infotech');
  const [body, setBody] = useState(
    `Dear {{name}},\n\nGreetings from Odd Infotech!\n\nWe noticed your enquiry regarding {{product}}. Please find attached our detailed proposal and service catalogue.\n\nLooking forward to collaborating with you.\n\nBest regards,\nOdd Infotech Team`
  );
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadLeads() {
      try {
        const { data } = await api.get('/leads');
        setLeads(data);
        setSelectedIds(data.map((l) => l._id));
      } catch (err) {
        console.error(err);
      }
    }
    loadLeads();
  }, []);

  function toggleAll() {
    if (selectedIds.length === leads.length) setSelectedIds([]);
    else setSelectedIds(leads.map((l) => l._id));
  }

  function toggleSelect(id) {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((i) => i !== id));
    else setSelectedIds([...selectedIds, id]);
  }

  async function handleSendBulk() {
    if (selectedIds.length === 0) {
      alert('Please select at least one recipient lead.');
      return;
    }
    setSending(true);
    try {
      for (const id of selectedIds) {
        await api.post(`/leads/${id}/send-email`).catch(() => {});
      }
      setMessage(`Bulk Email Campaign sent to ${selectedIds.length} recipients!`);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#121316] text-slate-200 font-sans selection:bg-amber-500/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="px-8 py-5 bg-[#16171a] border-b border-[#26272c] flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">📨</span>
            <h1 className="font-display font-bold text-lg text-white">Bulk Email Campaign</h1>
          </div>

          {message && (
            <div className="bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
              {message}
            </div>
          )}
        </header>

        <div className="px-8 py-8 max-w-5xl w-full mx-auto space-y-6">
          <div className="bg-[#18191d] border border-[#26272c] rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="font-display font-bold text-base text-white">Compose Bulk Email Campaign</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium mb-1 block">Email Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#121316] border border-[#2d2e35] rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium mb-1 block">Message Template</label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-[#121316] border border-[#2d2e35] rounded-xl p-4 text-white font-mono leading-relaxed focus:border-amber-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Placeholders: {'{{name}}'}, {'{{product}}'}, {'{{company}}'}
                </span>
              </div>
            </div>
          </div>

          {/* Recipients List */}
          <div className="bg-[#18191d] border border-[#26272c] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-white">
                Select Recipients ({selectedIds.length} / {leads.length})
              </h2>
              <button
                onClick={toggleAll}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                {selectedIds.length === leads.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[#232429] border border-[#26272c] rounded-xl bg-[#121316] p-2 scrollbar-thin">
              {leads.map((l) => (
                <div
                  key={l._id}
                  onClick={() => toggleSelect(l._id)}
                  className="flex items-center justify-between p-2.5 hover:bg-[#1b1c20] rounded-lg cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(l._id)}
                      onChange={() => {}}
                      className="accent-amber-500"
                    />
                    <div>
                      <span className="font-bold text-white">{l.senderName}</span>
                      <span className="text-slate-400 ml-2">({l.senderEmail || l.senderMobile})</span>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono">{l.productName}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSendBulk}
                disabled={sending}
                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {sending ? 'Sending Campaign...' : `🚀 Send Campaign to ${selectedIds.length} Leads`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
