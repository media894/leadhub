import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';

export default function EmailInbox() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchInbox() {
    setLoading(true);
    try {
      const { data } = await api.get('/leads/inbox');
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInbox();
  }, []);

  function deleteLog(id) {
    setLogs((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex min-h-screen bg-[#121316] text-slate-200 font-sans selection:bg-amber-500/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-8 py-4 bg-[#16171a] border-b border-[#26272c] flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">✉️</span>
            <div>
              <h1 className="font-display font-bold text-lg text-white">Email Inbox</h1>
              <p className="text-xs text-slate-400">View sent automated proposals and client activity history</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('All messages marked as read.')}
              className="bg-[#202126] hover:bg-[#2a2b32] text-slate-200 border border-[#32343c] text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              Mark all read
            </button>
            <button
              onClick={() => alert('Log reply form opened.')}
              className="bg-[#202126] hover:bg-[#2a2b32] text-amber-400 border border-amber-600/30 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
            >
              <span>+</span> Log reply
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-[#1b1c20] rounded-[10px] flex items-center justify-center text-white font-bold text-xs">
                🔴
              </div>
            </div>
          </div>
        </header>

        {/* Inbox Content List */}
        <div className="px-8 py-6 max-w-6xl w-full mx-auto flex-1 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading sent inbox records...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2 bg-[#18191d] rounded-2xl border border-[#26272c]">
              <div className="text-2xl">📥</div>
              <div className="font-bold text-white text-sm">No sent messages yet</div>
              <div>Automated emails and WhatsApp messages sent to leads will show up here.</div>
            </div>
          ) : (
            logs.map((item) => (
              <div
                key={item.id}
                className="bg-[#18191d] hover:bg-[#1f2026] border border-[#26272c] hover:border-[#353742] rounded-2xl p-5 transition-all shadow-md flex items-start justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Badge & Recipient Header */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="bg-[#18392a] text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-700/50">
                      AUTO
                    </span>
                    <span className="text-slate-300 font-semibold truncate">
                      Sent to <strong className="text-white">{item.recipient}</strong>
                    </span>
                    <span className="bg-emerald-950/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-600/40">
                      ✓ SENT
                    </span>
                  </div>

                  {/* Subject / Title */}
                  <div className="font-bold text-white text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </div>

                  {/* Body Preview */}
                  <div className="text-xs text-slate-400 leading-relaxed font-sans whitespace-pre-line bg-[#131417] p-3 rounded-xl border border-[#232429]">
                    {item.body}
                  </div>
                </div>

                {/* Right Date & Delete Action */}
                <div className="flex flex-col items-end justify-between h-full space-y-4 shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(item.sentAt).toLocaleString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => deleteLog(item.id)}
                    className="text-xs text-slate-500 hover:text-red-400 border border-[#2e2f36] hover:border-red-800 px-3 py-1 rounded-xl transition-all hover:bg-red-950/20"
                  >
                    Delete
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
