import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';

export default function Followups() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFollowups() {
      setLoading(true);
      try {
        const { data } = await api.get('/leads');
        setLeads(data.filter((l) => l.status === 'Contacted' || l.starred || l.status === 'New'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFollowups();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#121316] text-slate-200 font-sans selection:bg-amber-500/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="px-8 py-5 bg-[#16171a] border-b border-[#26272c] flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h1 className="font-display font-bold text-lg text-white">Lead Followups & Reminders</h1>
              <p className="text-xs text-slate-400">Track high priority leads needing follow-up calls & email replies</p>
            </div>
          </div>
        </header>

        <div className="px-8 py-8 max-w-6xl w-full mx-auto space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading follow-ups list...</div>
          ) : (
            leads.map((l) => (
              <div
                key={l._id}
                className="bg-[#18191d] border border-[#26272c] hover:border-[#353742] rounded-2xl p-5 transition-all shadow-md flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{l.senderName}</span>
                    <span className="text-xs text-amber-400 font-semibold">({l.productName})</span>
                    {l.aiScore >= 70 && (
                      <span className="bg-orange-950/80 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-600/40">
                        🔥 HOT {l.aiScore}/100
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    📍 {l.senderCity || 'India'} | 📞 {l.senderMobile || '—'} | ✉️ {l.senderEmail || '—'}
                  </div>
                  <div className="text-xs text-slate-300 italic mt-1 bg-[#121316] p-2 rounded-lg border border-[#26272c] inline-block">
                    "{l.queryMessage || 'Follow-up requirement.'}"
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => api.post(`/leads/${l._id}/send-whatsapp`)}
                    className="bg-[#143a29] hover:bg-[#1a4a35] text-emerald-400 border border-emerald-800/50 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
                  >
                    💬 WhatsApp Followup
                  </button>
                  <button
                    onClick={() => api.post(`/leads/${l._id}/send-email`)}
                    className="bg-[#1e2330] hover:bg-[#262c3d] text-blue-400 border border-blue-900/50 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
                  >
                    ✉️ Email Followup
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
